import { NextRequest, NextResponse } from 'next/server';

import * as refreshTokenService from '@/db/service/refresh-token';
import { hashRefreshToken } from '@/lib/auth/generate-token';
import { successResponse } from '@/lib/server-response';

export const runtime = 'nodejs';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    await refreshTokenService.revokeRefreshTokenByHash(refreshTokenHash);
  }

  const response = NextResponse.json(
    successResponse({ ok: true }, 'Logout successful'),
    { status: 200 }
  );

  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    path: '/api/auth/refresh',
    maxAge: 0,
  });

  return response;
}
