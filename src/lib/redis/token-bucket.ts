import type { GovernanceConfig } from './config';
import type { RedisCommandClient } from './client';

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
