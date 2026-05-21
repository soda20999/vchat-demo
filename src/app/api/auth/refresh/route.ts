import { NextRequest } from 'next/server';

import * as refreshTokenService from '@/db/service/refresh-token';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
} from '@/lib/auth/generate-token';
import { jsonErrorResponse, jsonSuccessResponse } from '@/lib/api-error';

export const runtime = 'nodejs';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

function isSecureCookie() {
  return process.env.NODE_ENV === 'production';
}

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return jsonErrorResponse('Refresh token is missing', 401);
  }

  const refreshTokenHash = await hashRefreshToken(refreshToken);
  const tokenRecord = await refreshTokenService.getActiveRefreshTokenByHash(
    refreshTokenHash
  );

  if (!tokenRecord || tokenRecord.expiresAt <= new Date()) {
    return jsonErrorResponse('Refresh token is invalid or expired', 401);
  }

  // Rotation: 旧 RT 作废，换发新的 AT/RT。
  await refreshTokenService.revokeRefreshTokenById(tokenRecord.id);

  const accessToken = await generateAccessToken({
    userId: tokenRecord.userId,
    role: 'user',
  });
  const nextRefreshToken = generateRefreshToken();
  const nextRefreshTokenHash = await hashRefreshToken(nextRefreshToken);
  const nextRefreshTokenExpiresAt = getRefreshTokenExpiresAt();

  await refreshTokenService.createRefreshToken(
    tokenRecord.userId,
    nextRefreshTokenHash,
    nextRefreshTokenExpiresAt
  );

  const response = jsonSuccessResponse({ ok: true }, 'Token refreshed');

  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, nextRefreshToken, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: 'lax',
    path: '/api/auth/refresh',
    expires: nextRefreshTokenExpiresAt,
  });

  return response;
}
