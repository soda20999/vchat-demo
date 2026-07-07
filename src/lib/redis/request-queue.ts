import type { GovernanceConfig } from './config';
import type { RedisCommandClient } from './client';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
