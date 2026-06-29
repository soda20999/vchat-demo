import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogMetadata = Record<string, unknown>;

export interface Logger {
  debug(message: string, metadata?: LogMetadata): void;
  info(message: string, metadata?: LogMetadata): void;
  warn(message: string, metadata?: LogMetadata): void;
  error(message: string, metadata?: LogMetadata): void;
}

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|api[-_]?key|authorization|cookie/i;

function normalizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (typeof value === 'object' && value !== null) {
    return redactMetadata(value as LogMetadata);
  }

  return value;
}

export function redactMetadata(metadata: LogMetadata): LogMetadata {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : normalizeValue(value),
    ])
  );
}

function shouldWriteToFile() {
  return process.env.LOG_TO_FILE === 'true';
}

function getLogDir() {
  return process.env.LOG_DIR || join(process.cwd(), 'logs');
}

function writeConsole(level: LogLevel, line: string) {
  if (level === 'debug') {
    console.debug(line);
    return;
  }

  if (level === 'info') {
    console.info(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.error(line);
}

function writeFiles(level: LogLevel, line: string) {
  if (!shouldWriteToFile()) return;

  const logDir = getLogDir();
  mkdirSync(logDir, { recursive: true });
  appendFileSync(join(logDir, 'app.log'), `${line}\n`, 'utf8');

  if (level === 'error') {
    appendFileSync(join(logDir, 'error.log'), `${line}\n`, 'utf8');
  }
}

export function createLogger(): Logger {
  const log = (level: LogLevel, message: string, metadata: LogMetadata = {}) => {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...redactMetadata(metadata),
    });

    writeConsole(level, line);
    writeFiles(level, line);
  };

  return {
    debug: (message, metadata) => log('debug', message, metadata),
    info: (message, metadata) => log('info', message, metadata),
    warn: (message, metadata) => log('warn', message, metadata),
    error: (message, metadata) => log('error', message, metadata),
  };
}

export const logger = createLogger();
