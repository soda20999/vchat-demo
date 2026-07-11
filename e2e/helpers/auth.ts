import type { BrowserContext } from '@playwright/test';
import { SignJWT } from 'jose';

const BASE_URL = 'http://127.0.0.1:3000';

function getJwtSecret() {
  return process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    'your-very-long-random-secret';
}

export async function createAccessToken() {
  return new SignJWT({ userId: 'e2e-user', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(getJwtSecret()));
}

export async function signInE2EUser(context: BrowserContext) {
  await context.addCookies([
    {
      name: 'access_token',
      value: await createAccessToken(),
      url: BASE_URL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}