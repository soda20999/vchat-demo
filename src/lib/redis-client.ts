import { logger } from './logger';

export type RedisCommandArg = string | number;

export interface RedisCommandClient {
  command<T = unknown>(args: RedisCommandArg[]): Promise<T>;
}

class RedisRestClient implements RedisCommandClient {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async command<T = unknown>(args: RedisCommandArg[]): Promise<T> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      throw new Error(`Redis command failed: ${response.status}`);
    }

    const payload = (await response.json()) as { result?: T; error?: string };
    if (payload.error) throw new Error(payload.error);

    return payload.result as T;
  }
}

let cachedClient: RedisCommandClient | null | undefined;

export function getRedisCommandClient() {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.REDIS_REST_URL?.trim();
  const token = process.env.REDIS_REST_TOKEN?.trim();

  if (!url || !token || url.includes('your_redis')) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new RedisRestClient(url, token);
  logger.info('Redis governance client enabled', {
    scope: 'redis.client',
  });
  return cachedClient;
}
