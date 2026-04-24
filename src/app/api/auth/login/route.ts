import { NextRequest, NextResponse } from 'next/server';

import * as refreshTokenService from '@/db/service/refresh-token';
import * as userService from '@/db/service/user';
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
} from '@/lib/auth/generate-token';
import { verifyPassword } from '@/lib/auth/password';
import { validateRequestBody } from '@/lib/api-handler';
import { successResponse } from '@/lib/server-response';
import { loginSchema, type LoginPayload } from '@/lib/validators';

export const runtime = 'nodejs';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

function isSecureCookie() {
  return process.env.NODE_ENV === 'production';
}

export async function POST(req: NextRequest) {
  try {
    const { data, error } = await validateRequestBody<LoginPayload>(req, loginSchema);
    if (error) return error;

    const user = await userService.getUserByEmail(data!.email);
    if (!user || !verifyPassword(data!.password, user.password)) {
      return NextResponse.json(
        { code: 401, message: 'Invalid email or password', timestamp: Date.now() },
        { status: 401 }
      );
    }

    const accessToken = await generateAccessToken({
      userId: user.id,
      role: 'user',
    });
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = await hashRefreshToken(refreshToken);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt();

    await refreshTokenService.createRefreshToken(
      user.id,
      refreshTokenHash,
      refreshTokenExpiresAt
    );

    const response = NextResponse.json(
      successResponse(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            signature: user.signature,
          },
        },
        'Login successful'
      ),
      { status: 200 }
    );

    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isSecureCookie(),
      sameSite: 'lax',
      path: '/api/auth/refresh',
      expires: refreshTokenExpiresAt,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { code: 500, message, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
