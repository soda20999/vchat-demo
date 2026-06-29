import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLogger } from './logger';

const originalEnv = { ...process.env };

let tempLogDir: string | undefined;

function parseJsonLine(line: string) {
  return JSON.parse(line) as Record<string, unknown>;
}

describe('logger', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-29T12:34:56.000Z'));
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    process.env = { ...originalEnv };

    if (tempLogDir) {
      await rm(tempLogDir, { recursive: true, force: true });
      tempLogDir = undefined;
    }
  });

  it('writes structured JSON logs to console by default for each level', () => {
    const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger();

    logger.debug('debug message', { requestId: 'req-1' });
    logger.info('info message', { requestId: 'req-2' });
    logger.warn('warn message', { requestId: 'req-3' });
    logger.error('error message', { requestId: 'req-4' });

    expect(parseJsonLine(consoleDebug.mock.calls[0][0])).toMatchObject({
      timestamp: '2026-06-29T12:34:56.000Z',
      level: 'debug',
      message: 'debug message',
      requestId: 'req-1',
    });
    expect(parseJsonLine(consoleInfo.mock.calls[0][0])).toMatchObject({
      level: 'info',
      message: 'info message',
      requestId: 'req-2',
    });
    expect(parseJsonLine(consoleWarn.mock.calls[0][0])).toMatchObject({
      level: 'warn',
      message: 'warn message',
      requestId: 'req-3',
    });
    expect(parseJsonLine(consoleError.mock.calls[0][0])).toMatchObject({
      level: 'error',
      message: 'error message',
      requestId: 'req-4',
    });
  });

  it('writes all file-enabled logs to app.log and errors additionally to error.log', async () => {
    tempLogDir = await mkdtemp(join(tmpdir(), 'vchat-logger-'));
    process.env.LOG_TO_FILE = 'true';
    process.env.LOG_DIR = tempLogDir;
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const logger = createLogger();

    logger.info('user signed in', { userId: 7 });
    logger.error('send failed', { conversationId: 12 });

    const appLines = (await readFile(join(tempLogDir, 'app.log'), 'utf8'))
      .trim()
      .split('\n')
      .map(parseJsonLine);
    const errorLines = (await readFile(join(tempLogDir, 'error.log'), 'utf8'))
      .trim()
      .split('\n')
      .map(parseJsonLine);

    expect(appLines).toEqual([
      expect.objectContaining({
        level: 'info',
        message: 'user signed in',
        userId: 7,
      }),
      expect.objectContaining({
        level: 'error',
        message: 'send failed',
        conversationId: 12,
      }),
    ]);
    expect(errorLines).toEqual([
      expect.objectContaining({
        level: 'error',
        message: 'send failed',
        conversationId: 12,
      }),
    ]);
  });

  it('redacts sensitive fields before writing to every destination', async () => {
    tempLogDir = await mkdtemp(join(tmpdir(), 'vchat-logger-'));
    process.env.LOG_TO_FILE = 'true';
    process.env.LOG_DIR = tempLogDir;
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    const logger = createLogger();

    logger.info('profile updated', {
      authorization: 'Bearer token',
      nested: {
        password: 'secret',
        token: 'abc123',
        keep: 'visible',
      },
    });

    const consoleEntry = parseJsonLine(consoleInfo.mock.calls[0][0]);
    const fileEntry = parseJsonLine(
      (await readFile(join(tempLogDir, 'app.log'), 'utf8')).trim()
    );

    expect(consoleEntry).toMatchObject({
      authorization: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        token: '[REDACTED]',
        keep: 'visible',
      },
    });
    expect(fileEntry).toMatchObject(consoleEntry);
  });
});
