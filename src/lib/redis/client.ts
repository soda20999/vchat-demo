import Redis from 'ioredis';

import { logger } from '../logger';

export type RedisCommandArg = string | number;
const DEFAULT_COMMAND_TIMEOUT_MS = 1000;

export interface RedisCommandClient {
  command<T = unknown>(args: RedisCommandArg[]): Promise<T>;
}

function getCommandTimeoutMs() {
  const value = Number(process.env.AI_REDIS_COMMAND_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_COMMAND_TIMEOUT_MS;
}

class RedisRestClient implements RedisCommandClient {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async command<T = unknown>(args: RedisCommandArg[]): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getCommandTimeoutMs());
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${this.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(args),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Redis command failed: ${response.status}`);
      }

      const payload = (await response.json()) as { result?: T; error?: string };
      if (payload.error) throw new Error(payload.error);

      return payload.result as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

class IoredisCommandClient implements RedisCommandClient {
  private readonly client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      connectionName: 'vchat-ai-governance',
      commandTimeout: getCommandTimeoutMs(),
      maxRetriesPerRequest: 1,
    });
  }

  async command<T = unknown>(args: RedisCommandArg[]): Promise<T> {
    const [command, ...commandArgs] = args;
    return this.client.call(String(command), ...commandArgs) as Promise<T>;
  }
}

let cachedClient: RedisCommandClient | null | undefined;

export function getRedisCommandClient() {
  if (cachedClient !== undefined) return cachedClient;

  const redisUrl = process.env.REDIS_URL?.trim();
  const restUrl = process.env.REDIS_REST_URL?.trim();
  const restToken = process.env.REDIS_REST_TOKEN?.trim();

  if (redisUrl && !redisUrl.includes('your_redis')) {
    cachedClient = new IoredisCommandClient(redisUrl);
    logger.info('Redis governance client enabled', {
      scope: 'redis.client',
      driver: 'ioredis',
    });
    return cachedClient;
  }

  if (!restUrl || !restToken || restUrl.includes('your_redis')) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new RedisRestClient(restUrl, restToken);
  logger.info('Redis governance client enabled', {
    scope: 'redis.client',
    driver: 'rest',
  });
  return cachedClient;
}
