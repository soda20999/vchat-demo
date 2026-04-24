import { NextRequest, NextResponse } from 'next/server';

import { verifyAccessToken } from '@/lib/auth/verify-token';

const PUBLIC_PATHS = new Set(['/auth']);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname.startsWith('/favicon')) return true;
  if (pathname.startsWith('/api/auth')) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  if (pathname === '/auth' && accessToken) {
    try {
      await verifyAccessToken(accessToken);
      return NextResponse.redirect(new URL('/', request.url));
    } catch {
      // Invalid token: stay on auth page.
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!accessToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Access token is missing' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/auth', request.url));
  }

  try {
    // Proxy 只校验 AT，不查库。
    const payload = await verifyAccessToken(accessToken);
    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-role', payload.role);

    return NextResponse.next({
      request: {
        headers,
      },
    });
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Access token is invalid or expired' }, { status: 401 });
    }

    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
