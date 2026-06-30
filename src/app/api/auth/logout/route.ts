import { NextRequest, type NextResponse } from 'next/server';

import * as refreshTokenService from '@/db/service/refresh-token';
import { hashRefreshToken } from '@/lib/auth/generate-token';
import { jsonErrorResponse, jsonSuccessResponse } from '@/lib/api-error';

export const runtime = 'nodejs';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

function isSecureCookie() {
  return process.env.NODE_ENV === 'production';
}

function expireAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 0,
  });
}

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

    if (refreshToken) {
      const refreshTokenHash = await hashRefreshToken(refreshToken);
      await refreshTokenService.revokeRefreshTokenByHash(refreshTokenHash);
    }

    const response = jsonSuccessResponse({ ok: true }, 'Logout successful');
    expireAuthCookies(response);

    return response;
  } catch {
    const response = jsonErrorResponse('Logout failed', 500);
    expireAuthCookies(response);

    return response;
  }
}
