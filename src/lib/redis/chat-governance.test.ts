import { afterEach, describe, expect, it, vi } from 'vitest';

import { createChatRequestGuard } from './chat-governance';
import type { RedisCommandArg, RedisCommandClient } from './client';
import { acquireDistributedLock } from './distributed-lock';
import { waitForQueueTurn } from './request-queue';
import { consumeTokenBucket } from './token-bucket';

class FakeRedis implements RedisCommandClient {
  calls: RedisCommandArg[][] = [];
  values = new Map<string, string>();
  zsets = new Map<string, string[]>();
  setResult: string | null = 'OK';
  evalResult: unknown = [1, 0];
  failDel = false;

  async command<T = unknown>(args: RedisCommandArg[]): Promise<T> {
    this.calls.push(args);
    const command = String(args[0]).toUpperCase();

    if (command === 'EVAL') return this.evalResult as T;
    if (command === 'GET') return (this.values.get(String(args[1])) ?? null) as T;
    if (command === 'SET') {
      const key = String(args[1]);
      if (args.includes('NX') && this.values.has(key)) return null as T;
      if (this.setResult === 'OK') this.values.set(key, String(args[2]));
      return this.setResult as T;
    }
    if (command === 'PSETEX') {
      this.values.set(String(args[1]), String(args[3]));
      return 'OK' as T;
    }
    if (command === 'DEL') {
      if (this.failDel) throw new Error('del failed');
      this.values.delete(String(args[1]));
      return 1 as T;
    }
    if (command === 'PTTL') return 120_000 as T;
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it('marks requestId requests as processing and completed with the idempotency ttl', async () => {
    const redis = new FakeRedis();
    vi.stubEnv('AI_IDEMPOTENCY_TTL_MS', '60000');

    const guard = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: 1,
        content: 'hello',
        requestId: 'request-1',
      },
      redis
    );

    expect(guard.allowed).toBe(true);
    expect(redis.calls).toContainEqual([
      'SET',
      'ai:idempotency:user-1:request-1',
      'processing',
      'NX',
      'PX',
      60_000,
    ]);

    if (guard.allowed) await guard.release();
    expect(redis.values.get('ai:idempotency:user-1:request-1')).toBe('completed');
  });

  it('rejects duplicate requestId requests that are already processing or completed', async () => {
    const redis = new FakeRedis();
    redis.values.set('ai:idempotency:user-1:request-1', 'processing');

    await expect(
      createChatRequestGuard(
        {
          userId: 'user-1',
          model: 'deepseek-v4-pro',
          providerName: 'deepseek',
          conversationId: 1,
          content: 'hello',
          requestId: 'request-1',
        },
        redis
      )
    ).resolves.toEqual({
      allowed: false,
      message: '重复请求正在处理中，请稍后再试',
      status: 409,
    });

    redis.values.set('ai:idempotency:user-1:request-1', 'completed');
    await expect(
      createChatRequestGuard(
        {
          userId: 'user-1',
          model: 'deepseek-v4-pro',
          providerName: 'deepseek',
          conversationId: 1,
          content: 'hello',
          requestId: 'request-1',
        },
        redis
      )
    ).resolves.toEqual({
      allowed: false,
      message: '重复请求已处理，请勿重复提交',
      status: 409,
    });
  });

  it('uses a conversation lock key and reports the required message on lock conflicts', async () => {
    const redis = new FakeRedis();
    const lockKey = 'ai:lock:conversation:1';
    redis.values.set(lockKey, 'other-owner');

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

    expect(guard).toEqual({
      allowed: false,
      message: '当前会话正在回复中，请稍后再发送',
      status: 409,
    });
    expect(redis.calls).toContainEqual([
      'SET',
      lockKey,
      expect.any(String),
      'NX',
      'PX',
      expect.any(Number),
    ]);
  });

  it('allows different conversations to run concurrently', async () => {
    const redis = new FakeRedis();

    const first = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: 1,
        content: 'hello',
      },
      redis,
    );
    const second = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: 2,
        content: 'hello again',
      },
      redis,
    );

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(redis.calls).toContainEqual([
      'SET',
      'ai:lock:conversation:1',
      expect.any(String),
      'NX',
      'PX',
      expect.any(Number),
    ]);
    expect(redis.calls).toContainEqual([
      'SET',
      'ai:lock:conversation:2',
      expect.any(String),
      'NX',
      'PX',
      expect.any(Number),
    ]);
  });

  it('rejects duplicate new-conversation requests with the same requestId', async () => {
    const redis = new FakeRedis();
    const first = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: null,
        content: 'hello',
        requestId: 'new-chat-request',
      },
      redis,
    );
    const second = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: null,
        content: 'hello',
        requestId: 'new-chat-request',
      },
      redis,
    );

    expect(first.allowed).toBe(true);
    expect(second).toMatchObject({ allowed: false, status: 409 });
    expect(redis.calls).toContainEqual([
      'SET',
      'ai:idempotency:user-1:new-chat-request',
      'processing',
      'NX',
      'PX',
      expect.any(Number),
    ]);
  });

  it('cleans idempotency state when token bucket rejects a requestId request', async () => {
    const redis = new FakeRedis();
    redis.evalResult = [0, 500];

    const guard = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: 1,
        content: 'hello',
        requestId: 'rate-limited-request',
      },
      redis,
    );

    expect(guard).toMatchObject({ allowed: false, status: 409 });
    expect(redis.values.has('ai:idempotency:user-1:rate-limited-request')).toBe(false);
  });

  it('keeps lock conflicts rejected even when best-effort cleanup fails', async () => {
    const redis = new FakeRedis();
    redis.failDel = true;
    redis.values.set('ai:lock:conversation:1', 'other-owner');

    const guard = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: 1,
        content: 'hello',
        requestId: 'request-1',
      },
      redis,
    );

    expect(guard).toEqual({
      allowed: false,
      message: '当前会话正在回复中，请稍后再发送',
      status: 409,
    });
  });

  it('does not enable completed idempotency state for legacy idempotencyKey-only requests', async () => {
    const redis = new FakeRedis();

    const guard = await createChatRequestGuard(
      {
        userId: 'user-1',
        model: 'deepseek-v4-pro',
        providerName: 'deepseek',
        conversationId: null,
        content: 'hello',
        idempotencyKey: 'legacy-key',
      },
      redis
    );

    expect(guard.allowed).toBe(true);
    if (guard.allowed) await guard.release();
    expect(redis.calls).not.toContainEqual([
      'PSETEX',
      expect.stringContaining('ai:idempotency:user-1:'),
      expect.any(Number),
      'completed',
    ]);
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
