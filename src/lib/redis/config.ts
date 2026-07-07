export interface GovernanceConfig {
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

export function getGovernanceConfig(): GovernanceConfig {
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
