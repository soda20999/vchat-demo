import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

// 兼容旧的明文密码，以及新的 scrypt 哈希格式。
export function verifyPassword(inputPassword: string, storedPassword: string) {
  if (!storedPassword.startsWith('scrypt:')) {
    return inputPassword === storedPassword;
  }

  const [, salt, hash] = storedPassword.split(':');
  if (!salt || !hash) return false;

  const derived = scryptSync(inputPassword, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
}
