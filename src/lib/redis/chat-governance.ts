import { createHash, randomUUID } from 'node:crypto';

import { logger } from '../logger';
import { getRedisCommandClient } from './client';
import { getGovernanceConfig } from './config';
import { acquireDistributedLock } from './distributed-lock';
import { waitForQueueTurn } from './request-queue';
import { consumeTokenBucket } from './token-bucket';

const DUPLICATE_PROCESSING_MESSAGE = '重复请求正在处理中，请稍后再试';
const DUPLICATE_COMPLETED_MESSAGE = '重复请求已处理，请勿重复提交';
const CONVERSATION_LOCK_MESSAGE = '当前会话正在回复中，请稍后再发送';

export interface ChatGovernanceInput {
  userId: string;
  model: string;
  providerName: string;
  conversationId: number | null;
  content: string;
  image?: string;
  requestId?: string | null;
  idempotencyKey?: string | null;
}

export type ChatGovernanceGuard =
  | { allowed: true; release: () => Promise<void> }
  | { allowed: false; message: string; status?: number };

function hashKey(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

function buildRequestKey(input: ChatGovernanceInput) {
  if (input.requestId?.trim()) return hashKey(input.requestId.trim());
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

function getIdempotencyTtlMs() {
  const value = Number(process.env.AI_IDEMPOTENCY_TTL_MS);
  return Number.isFinite(value) && value > 0 ? value : 1_800_000;
}

function buildLockKey(input: ChatGovernanceInput, requestKey: string) {
  if (input.conversationId !== null) return `ai:lock:conversation:${input.conversationId}`;
  return `ai:lock:${input.userId}:${requestKey}`;
}

async function completeIdempotency(redis: ReturnType<typeof getRedisCommandClient>, key: string) {
  if (!redis) return;

  const ttl = await redis.command<number>(['PTTL', key]);
  if (ttl > 0) {
    await redis.command(['PSETEX', key, ttl, 'completed']);
    return;
  }

  await redis.command(['PSETEX', key, getIdempotencyTtlMs(), 'completed']);
}

async function clearIdempotency(redis: ReturnType<typeof getRedisCommandClient>, key: string | null) {
  if (!redis || !key) return;
  await redis.command(['DEL', key]);
}

async function cleanupRejectedRequest(
  redis: ReturnType<typeof getRedisCommandClient>,
  queueKey: string,
  queueRequestId: string,
  idempotencyKey: string | null,
  queueJoined: boolean,
) {
  if (!redis) return;

  await Promise.allSettled([
    queueJoined ? redis.command(['ZREM', queueKey, queueRequestId]) : Promise.resolve(),
    clearIdempotency(redis, idempotencyKey),
  ]);
}

export async function createChatRequestGuard(
  input: ChatGovernanceInput,
  redis = getRedisCommandClient()
): Promise<ChatGovernanceGuard> {
  if (!redis || process.env.AI_GOVERNANCE_ENABLED === 'false') {
    return { allowed: true, release: async () => {} };
  }

  const config = getGovernanceConfig();
  const queueRequestId = randomUUID();
  const clientRequestId = input.requestId?.trim() || null;
  const requestKey = buildRequestKey(input);
  const queueKey = `ai:queue:${input.providerName}:${input.model}`;
  const lockKey = buildLockKey(input, requestKey);
  const idempotencyKey = clientRequestId
    ? `ai:idempotency:${input.userId}:${clientRequestId}`
    : null;
  let queueJoined = false;
  let idempotencyStarted = false;

  try {
    if (idempotencyKey) {
      const result = await redis.command<string | null>([
        'SET',
        idempotencyKey,
        'processing',
        'NX',
        'PX',
        getIdempotencyTtlMs(),
      ]);

      if (result !== 'OK') {
        const status = await redis.command<string | null>(['GET', idempotencyKey]);
        return {
          allowed: false,
          message:
            status === 'completed'
              ? DUPLICATE_COMPLETED_MESSAGE
              : DUPLICATE_PROCESSING_MESSAGE,
          status: 409,
        };
      }

      idempotencyStarted = true;
    }

    const token = await consumeTokenBucket(redis, `ai:rate:${input.userId}`, config);
    if (!token.allowed) {
      if (idempotencyStarted) {
        await cleanupRejectedRequest(redis, queueKey, queueRequestId, idempotencyKey, false);
      }
      return {
        allowed: false,
        message: `AI request rate limit exceeded, retry after ${token.retryAfterMs}ms`,
        status: 409,
      };
    }

    queueJoined = true;
    const queue = await waitForQueueTurn(redis, queueKey, queueRequestId, config);
    if (!queue.allowed) {
      if (idempotencyStarted) {
        await cleanupRejectedRequest(redis, queueKey, queueRequestId, idempotencyKey, false);
      }
      return { ...queue, status: 409 };
    }

    const lock = await acquireDistributedLock(
      redis,
      lockKey,
      config.lockTtlMs,
      config.lockRenewIntervalMs
    );
    if (!lock.acquired) {
      await cleanupRejectedRequest(redis, queueKey, queueRequestId, idempotencyKey, true);
      return {
        allowed: false,
        message:
          input.conversationId !== null
            ? CONVERSATION_LOCK_MESSAGE
            : 'Duplicate AI request is already running, please wait',
        status: 409,
      };
    }

    let released = false;
    return {
      allowed: true,
      async release() {
        if (released) return;
        released = true;
        const cleanupTasks: Promise<unknown>[] = [
          redis.command(['ZREM', queueKey, queueRequestId]),
          lock.release(),
        ];
        if (idempotencyStarted && idempotencyKey) {
          cleanupTasks.push(completeIdempotency(redis, idempotencyKey));
        }
        await Promise.allSettled(cleanupTasks);
      },
    };
  } catch (error) {
    if (queueJoined) {
      await redis.command(['ZREM', queueKey, queueRequestId]).catch(() => {});
    }
    if (idempotencyStarted) {
      await clearIdempotency(redis, idempotencyKey).catch(() => {});
    }
    logger.warn('AI governance unavailable, allowing request', {
      scope: 'ai.governance',
      error,
    });
    return { allowed: true, release: async () => {} };
  }
}
