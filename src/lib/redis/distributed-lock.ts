import { randomUUID } from 'node:crypto';

import { logger } from '../logger';
import type { RedisCommandClient } from './client';

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
