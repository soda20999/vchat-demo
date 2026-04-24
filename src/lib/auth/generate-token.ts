import { SignJWT } from 'jose';

type AccessTokenPayload = {
  userId: string;
  role: string;
};

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

function getAccessTokenSecret() {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET is missing');
  }
  return new TextEncoder().encode(secret);
}

export async function generateAccessToken(payload: AccessTokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(getAccessTokenSecret());
}

export function generateRefreshToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '');
}

export async function hashRefreshToken(token: string) {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function getRefreshTokenExpiresAt() {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);
}
