import { NextRequest, NextResponse } from 'next/server';

/**
 * Interim admin access gate (Phase 1 containment).
 *
 * The admin console does not yet use the API's real admin authentication
 * (password + TOTP), so every request — pages and `/api/*` routes alike — is
 * protected here with HTTP Basic credentials taken from the environment:
 *
 *   ADMIN_GATE_USER, ADMIN_GATE_PASSWORD
 *
 * The gate fails closed: when the credentials are not configured, the admin app
 * answers 503. For local development only, ADMIN_GATE_DISABLED=true bypasses the
 * gate; it is ignored when NODE_ENV=production.
 *
 * This gate is replaced by real session-based admin auth in Phase 6.
 */

const NO_INDEX = 'noindex, nofollow, noarchive, nosnippet';

function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

function parseBasicAuth(header: string | null): { user: string; password: string } | null {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const sep = decoded.indexOf(':');
    if (sep === -1) return null;
    return { user: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  // Liveness probe for container healthchecks; returns no data.
  if (request.nextUrl.pathname === '/healthz') {
    return NextResponse.next();
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const bypass =
    !isProduction &&
    (process.env.ADMIN_GATE_DISABLED === 'true' ||
      (!process.env.ADMIN_GATE_USER && !process.env.ADMIN_GATE_PASSWORD));

  if (bypass) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', NO_INDEX);
    return res;
  }

  const expectedUser = process.env.ADMIN_GATE_USER;
  const expectedPassword = process.env.ADMIN_GATE_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new NextResponse('Admin console is locked: access gate is not configured.', {
      status: 503,
      headers: { 'X-Robots-Tag': NO_INDEX, 'Cache-Control': 'no-store' },
    });
  }

  const credentials = parseBasicAuth(request.headers.get('authorization'));
  const userOk = credentials !== null && constantTimeEqual(credentials.user, expectedUser);
  const passwordOk = credentials !== null && constantTimeEqual(credentials.password, expectedPassword);

  if (!userOk || !passwordOk) {
    return new NextResponse('Authentication required.', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="ASCEND Admin", charset="UTF-8"',
        'X-Robots-Tag': NO_INDEX,
        'Cache-Control': 'no-store',
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', NO_INDEX);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  // Everything except Next.js build assets.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
