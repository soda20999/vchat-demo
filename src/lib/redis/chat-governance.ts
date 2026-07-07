import { createHash, randomUUID } from 'node:crypto';

import { logger } from '../logger';
import { getRedisCommandClient } from './client';
import { getGovernanceConfig } from './config';
import { acquireDistributedLock } from './distributed-lock';
import { waitForQueueTurn } from './request-queue';
import { consumeTokenBucket } from './token-bucket';

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

export async function createChatRequestGuard(
  input: ChatGovernanceInput,
  redis = getRedisCommandClient()
): Promise<ChatGovernanceGuard> {
  if (!redis || process.env.AI_GOVERNANCE_ENABLED === 'false') {
    return { allowed: true, release: async () => {} };
  }

  const config = getGovernanceConfig();
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
