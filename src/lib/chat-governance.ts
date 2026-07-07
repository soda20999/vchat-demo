import { createHash, randomUUID } from 'node:crypto';

import { logger } from './logger';
import { getRedisCommandClient, type RedisCommandClient } from './redis-client';

const TOKEN_BUCKET_SCRIPT = `
local capacity = tonumber(ARGV[1])
local refillPerSecond = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local state = redis.call('HMGET', KEYS[1], 'tokens', 'updatedAt')
local tokens = tonumber(state[1]) or capacity
local updatedAt = tonumber(state[2]) or now
tokens = math.min(capacity, tokens + math.max(0, now - updatedAt) / 1000 * refillPerSecond)
if tokens < cost then
  local retryAfterMs = math.ceil((cost - tokens) / refillPerSecond * 1000)
  return {0, retryAfterMs}
end
tokens = tokens - cost
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'updatedAt', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / refillPerSecond * 2000))
return {1, 0}
`;

const RELEASE_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

const RENEW_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
return 0
`;

export interface ChatGovernanceInput {
  userId: string;
  model: string;
  providerName: string;
  conversationId: number | null;
  content: string;
  image?: string;
  idempotencyKey?: string | null;
}

export type ChatGovernanceGuard =
  | { allowed: true; release: () => Promise<void> }
  | { allowed: false; message: string };

interface GovernanceConfig {
  rateCapacity: number;
  rateRefillPerSecond: number;
  queueMaxConcurrent: number;
  queueWaitTimeoutMs: number;
  queueActiveTtlMs: number;
  queuePollIntervalMs: number;
  lockTtlMs: number;
  lockRenewIntervalMs: number;
}

const DEFAULT_CONFIG: GovernanceConfig = {
  rateCapacity: 20,
  rateRefillPerSecond: 1,
  queueMaxConcurrent: 5,
  queueWaitTimeoutMs: 10_000,
  queueActiveTtlMs: 180_000,
  queuePollIntervalMs: 100,
  lockTtlMs: 120_000,
  lockRenewIntervalMs: 30_000,
};

function readNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getConfig(): GovernanceConfig {
  return {
    rateCapacity: readNumber('AI_RATE_LIMIT_CAPACITY', DEFAULT_CONFIG.rateCapacity),
    rateRefillPerSecond: readNumber(
      'AI_RATE_LIMIT_REFILL_PER_SECOND',
      DEFAULT_CONFIG.rateRefillPerSecond
    ),
    queueMaxConcurrent: readNumber(
      'AI_QUEUE_MAX_CONCURRENT',
      DEFAULT_CONFIG.queueMaxConcurrent
    ),
    queueWaitTimeoutMs: readNumber(
      'AI_QUEUE_WAIT_TIMEOUT_MS',
      DEFAULT_CONFIG.queueWaitTimeoutMs
    ),
    queueActiveTtlMs: readNumber(
      'AI_QUEUE_ACTIVE_TTL_MS',
      DEFAULT_CONFIG.queueActiveTtlMs
    ),
    queuePollIntervalMs: readNumber(
      'AI_QUEUE_POLL_INTERVAL_MS',
      DEFAULT_CONFIG.queuePollIntervalMs
    ),
    lockTtlMs: readNumber('AI_LOCK_TTL_MS', DEFAULT_CONFIG.lockTtlMs),
    lockRenewIntervalMs: readNumber(
      'AI_LOCK_RENEW_INTERVAL_MS',
      DEFAULT_CONFIG.lockRenewIntervalMs
    ),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hashKey(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function buildRequestKey(input: ChatGovernanceInput) {
  if (input.idempotencyKey?.trim()) return hashKey(input.idempotencyKey.trim());

  return hashKey(
    JSON.stringify({
      userId: input.userId,
      conversationId: input.conversationId,
      model: input.model,
      content: input.content,
      image: input.image ? hashKey(input.image) : '',
    })
  );
}

export async function consumeTokenBucket(
  redis: RedisCommandClient,
  key: string,
  config: Pick<GovernanceConfig, 'rateCapacity' | 'rateRefillPerSecond'>
) {
  const result = await redis.command<[number, number]>([
    'EVAL',
    TOKEN_BUCKET_SCRIPT,
    1,
    key,
    config.rateCapacity,
    config.rateRefillPerSecond,
    Date.now(),
    1,
  ]);

  return {
    allowed: result[0] === 1,
    retryAfterMs: Number(result[1] ?? 0),
  };
}

export async function waitForQueueTurn(
  redis: RedisCommandClient,
  key: string,
  requestId: string,
  config: Pick<
    GovernanceConfig,
    'queueMaxConcurrent' | 'queueWaitTimeoutMs' | 'queueActiveTtlMs' | 'queuePollIntervalMs'
  >
) {
  const startedAt = Date.now();
  await redis.command(['ZADD', key, startedAt, requestId]);
  await redis.command(['PEXPIRE', key, config.queueActiveTtlMs]);

  while (Date.now() - startedAt <= config.queueWaitTimeoutMs) {
    await redis.command([
      'ZREMRANGEBYSCORE',
      key,
      '-inf',
      Date.now() - config.queueActiveTtlMs,
    ]);
    const rank = await redis.command<number | null>(['ZRANK', key, requestId]);
    if (typeof rank === 'number' && rank < config.queueMaxConcurrent) {
      return { allowed: true as const };
    }

    await sleep(config.queuePollIntervalMs);
  }

  await redis.command(['ZREM', key, requestId]);
  return {
    allowed: false as const,
    message: 'AI request queue is busy, please retry later',
  };
}

export async function acquireDistributedLock(
  redis: RedisCommandClient,
  key: string,
  ttlMs: number,
  renewIntervalMs = Math.max(1000, Math.floor(ttlMs / 4))
) {
  const owner = randomUUID();
  const result = await redis.command<string | null>(['SET', key, owner, 'NX', 'PX', ttlMs]);

  if (result !== 'OK') {
    return {
      acquired: false,
      release: async () => {},
    };
  }

  const renewTimer = setInterval(() => {
    void redis.command(['EVAL', RENEW_LOCK_SCRIPT, 1, key, owner, ttlMs]).catch((error) => {
      logger.warn('Renew AI governance lock failed', {
        scope: 'ai.governance',
        error,
      });
    });
  }, renewIntervalMs);
  renewTimer.unref?.();

  return {
    acquired: true,
    release: async () => {
      clearInterval(renewTimer);
      await redis.command(['EVAL', RELEASE_LOCK_SCRIPT, 1, key, owner]);
    },
  };
}

export async function createChatRequestGuard(
  input: ChatGovernanceInput,
  redis = getRedisCommandClient()
): Promise<ChatGovernanceGuard> {
  if (!redis || process.env.AI_GOVERNANCE_ENABLED === 'false') {
    return { allowed: true, release: async () => {} };
  }

  const config = getConfig();
  const requestId = randomUUID();
  const requestKey = buildRequestKey(input);
  const queueKey = `ai:queue:${input.providerName}:${input.model}`;
  const lockKey = `ai:lock:${input.userId}:${input.conversationId ?? requestKey}`;
  let queueJoined = false;

  try {
    const token = await consumeTokenBucket(redis, `ai:rate:${input.userId}`, config);
    if (!token.allowed) {
      return {
        allowed: false,
        message: `AI request rate limit exceeded, retry after ${token.retryAfterMs}ms`,
      };
    }

    queueJoined = true;
    const queue = await waitForQueueTurn(redis, queueKey, requestId, config);
    if (!queue.allowed) return queue;

    const lock = await acquireDistributedLock(
      redis,
      lockKey,
      config.lockTtlMs,
      config.lockRenewIntervalMs
    );
    if (!lock.acquired) {
      await redis.command(['ZREM', queueKey, requestId]);
      return {
        allowed: false,
        message: 'Duplicate AI request is already running, please wait',
      };
    }

    let released = false;
    return {
      allowed: true,
      async release() {
        if (released) return;
        released = true;
        await Promise.allSettled([
          redis.command(['ZREM', queueKey, requestId]),
          lock.release(),
        ]);
      },
    };
  } catch (error) {
    if (queueJoined) {
      await redis.command(['ZREM', queueKey, requestId]).catch(() => {});
    }
    logger.warn('AI governance unavailable, allowing request', {
      scope: 'ai.governance',
      error,
    });
    return { allowed: true, release: async () => {} };
  }
}
