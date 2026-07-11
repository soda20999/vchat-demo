import type { BrowserContext } from '@playwright/test';
import { SignJWT } from 'jose';

const BASE_URL = 'http://127.0.0.1:3000';

function getJwtSecret() {
  // E2E token 必须和应用校验 token 使用同一套密钥命名，兼容新旧环境变量。
  return (
    process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    'your-very-long-random-secret'
  );
}

export async function createAccessToken() {
  // 生成只用于浏览器测试的短期 access token，避免 E2E 依赖真实登录接口和数据库用户。
  return new SignJWT({ userId: 'e2e-user', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(getJwtSecret()));
}

export async function signInE2EUser(context: BrowserContext) {
  // 直接写入 httpOnly cookie，让受保护页面认为当前浏览器上下文已经登录。
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
