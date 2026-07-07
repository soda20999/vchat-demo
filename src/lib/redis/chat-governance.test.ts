import { describe, expect, it, vi } from 'vitest';

import { createChatRequestGuard } from './chat-governance';
import type { RedisCommandArg, RedisCommandClient } from './client';
import { acquireDistributedLock } from './distributed-lock';
import { waitForQueueTurn } from './request-queue';
import { consumeTokenBucket } from './token-bucket';

class FakeRedis implements RedisCommandClient {
  calls: RedisCommandArg[][] = [];
  zsets = new Map<string, string[]>();
  setResult: string | null = 'OK';
  evalResult: unknown = [1, 0];

  async command<T = unknown>(args: RedisCommandArg[]): Promise<T> {
    this.calls.push(args);
    const command = String(args[0]).toUpperCase();

    if (command === 'EVAL') return this.evalResult as T;
    if (command === 'SET') return this.setResult as T;
    if (command === 'ZADD') {
      const key = String(args[1]);
      const member = String(args[3]);
      this.zsets.set(key, [...(this.zsets.get(key) ?? []), member]);
      return 1 as T;
    }
    if (command === 'ZRANK') {
      const members = this.zsets.get(String(args[1])) ?? [];
      const rank = members.indexOf(String(args[2]));
      return (rank === -1 ? null : rank) as T;
    }
    if (command === 'ZREM') {
      const key = String(args[1]);
      const member = String(args[2]);
      this.zsets.set(
        key,
        (this.zsets.get(key) ?? []).filter((item) => item !== member)
      );
      return 1 as T;
    }
    if (command === 'ZREMRANGEBYSCORE' || command === 'PEXPIRE') return 1 as T;

    return null as T;
  }
}

class FailingAfterZaddRedis extends FakeRedis {
  async command<T = unknown>(args: RedisCommandArg[]): Promise<T> {
    if (args[0] === 'ZREM') {
      return super.command<T>(args);
    }

    const result = await super.command<T>(args);
    if (args[0] === 'ZADD') {
      throw new Error('redis failed after zadd');
    }

    return result;
  }
}

describe('AI chat governance', () => {
  it('uses a Redis Lua token bucket result to allow or reject requests', async () => {
    const redis = new FakeRedis();

    await expect(
      consumeTokenBucket(redis, 'ai:rate:user-1', {
        rateCapacity: 2,
        rateRefillPerSecond: 1,
      })
    ).resolves.toEqual({ allowed: true, retryAfterMs: 0 });

    redis.evalResult = [0, 500];
    await expect(
      consumeTokenBucket(redis, 'ai:rate:user-1', {
        rateCapacity: 2,
        rateRefillPerSecond: 1,
      })
    ).resolves.toEqual({ allowed: false, retryAfterMs: 500 });
    expect(redis.calls[0][0]).toBe('EVAL');
  });

  it('waits in a Redis sorted-set queue and removes the request on release', async () => {
    const redis = new FakeRedis();

    await expect(
      waitForQueueTurn(redis, 'ai:queue:deepseek:model', 'request-1', {
        queueMaxConcurrent: 1,
        queueWaitTimeoutMs: 50,
        queueActiveTtlMs: 120_000,
        queuePollIntervalMs: 1,
      })
    ).resolves.toEqual({ allowed: true });

    await redis.command(['ZREM', 'ai:queue:deepseek:model', 'request-1']);
    expect(redis.zsets.get('ai:queue:deepseek:model')).toEqual([]);
  });

  it('uses the active queue ttl instead of the wait timeout to keep long streams counted', async () => {
    const redis = new FakeRedis();

    await waitForQueueTurn(redis, 'ai:queue:deepseek:model', 'request-1', {
      queueMaxConcurrent: 1,
      queueWaitTimeoutMs: 50,
      queueActiveTtlMs: 180_000,
      queuePollIntervalMs: 1,
    });

    expect(redis.calls).toContainEqual([
      'PEXPIRE',
      'ai:queue:deepseek:model',
      180_000,
    ]);
    expect(redis.calls).toContainEqual([
      'ZREMRANGEBYSCORE',
      'ai:queue:deepseek:model',
      '-inf',
      expect.any(Number),
    ]);
  });

  it('acquires and releases a Redis distributed lock', async () => {
    const redis = new FakeRedis();
    const lock = await acquireDistributedLock(redis, 'ai:lock:user-1:chat', 1000);

    expect(lock.acquired).toBe(true);
    await lock.release();
    expect(redis.calls.some((args) => args[0] === 'SET')).toBe(true);
    expect(redis.calls.some((args) => args[0] === 'EVAL')).toBe(true);
  });

  it('renews an acquired distributed lock before release', async () => {
    vi.useFakeTimers();
    const redis = new FakeRedis();
    const lock = await acquireDistributedLock(redis, 'ai:lock:user-1:chat', 1000, 100);

    await vi.advanceTimersByTimeAsync(100);
    await lock.release();
    vi.useRealTimers();

    const evalCalls = redis.calls.filter((args) => args[0] === 'EVAL');
    expect(evalCalls.length).toBeGreaterThanOrEqual(2);
  });

  it('combines token bucket, queue, and lock into one releasable guard', async () => {
    const redis = new FakeRedis();

    const guard = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: 1,
        content: 'hello',
      },
      redis
    );

    expect(guard.allowed).toBe(true);
    if (guard.allowed) await guard.release();
    expect(redis.calls.map((args) => args[0])).toContain('ZREM');
  });

  it('fails open when Redis governance is unavailable', async () => {
    const redis: RedisCommandClient = {
      command: vi.fn(async () => {
        throw new Error('redis offline');
      }),
    };

    await expect(
      createChatRequestGuard(
        {
          userId: 'user-1',
          model: 'deepseek-v4-pro',
          providerName: 'deepseek',
          conversationId: 1,
          content: 'hello',
        },
        redis
      )
    ).resolves.toMatchObject({ allowed: true });
  });

  it('cleans the queue entry when Redis fails after enqueue', async () => {
    const redis = new FailingAfterZaddRedis();

    await expect(
      createChatRequestGuard(
        {
          userId: 'user-1',
          model: 'deepseek-v4-pro',
          providerName: 'deepseek',
          conversationId: 1,
          content: 'hello',
        },
        redis
      )
    ).resolves.toMatchObject({ allowed: true });

    expect(redis.calls).toContainEqual([
      'ZREM',
      expect.stringContaining('ai:queue:'),
      expect.any(String),
    ]);
  });
});
