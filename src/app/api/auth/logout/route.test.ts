import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from './route';

vi.mock('@/db/service/refresh-token', () => ({
  revokeRefreshTokenByHash: vi.fn(),
}));

vi.mock('@/lib/auth/generate-token', () => ({
  hashRefreshToken: vi.fn(),
}));

const refreshTokenService = await import('@/db/service/refresh-token');
const authTokens = await import('@/lib/auth/generate-token');

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authTokens.hashRefreshToken).mockResolvedValue('hashed-refresh-token');
  });

  it('revokes the refresh token and expires auth cookies', async () => {
    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: 'refresh_token=raw-refresh-token; access_token=raw-access-token',
      },
    });

    const response = await POST(request);

    expect(authTokens.hashRefreshToken).toHaveBeenCalledWith('raw-refresh-token');
    expect(refreshTokenService.revokeRefreshTokenByHash).toHaveBeenCalledWith(
      'hashed-refresh-token'
    );
    expect(response.status).toBe(200);

    const setCookie = response.headers.getSetCookie();
    expect(setCookie).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token=;'),
        expect.stringContaining('refresh_token=;'),
      ])
    );
    expect(setCookie.join('\n')).toContain('Max-Age=0');
    expect(setCookie.join('\n')).toContain('Path=/api/auth/refresh');
  });

  it('still expires cookies when token revocation fails', async () => {
    vi.mocked(refreshTokenService.revokeRefreshTokenByHash).mockRejectedValue(
      new Error('database offline')
    );

    const request = new NextRequest('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: {
        cookie: 'refresh_token=raw-refresh-token',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe('Logout failed');
    expect(response.headers.getSetCookie().join('\n')).toContain('Max-Age=0');
  });
});
