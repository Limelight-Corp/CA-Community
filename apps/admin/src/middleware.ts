import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  constantTimeEqual,
  gateBypassed,
  gateConfig,
  safeNextPath,
  verifySessionToken,
  type GateConfig,
} from './lib/admin-session';

/**
 * Admin access gate.
 *
 * The admin console does not yet use the API's real admin authentication (password + TOTP).
 * Every request — pages and `/api/*` routes alike — needs a signed session cookie issued by
 * the sign-in page at /login, which checks credentials from the environment:
 *
 *   ADMIN_GATE_USER, ADMIN_GATE_PASSWORD  (optional: ADMIN_SESSION_SECRET)
 *
 * HTTP Basic credentials are still accepted for scripted access, but the browser is no longer
 * prompted for them. The gate fails closed: when the credentials are not configured, the
 * admin app answers 503. For local development only, ADMIN_GATE_DISABLED=true bypasses the
 * gate; it is ignored when NODE_ENV=production.
 */

const NO_INDEX = 'noindex, nofollow, noarchive, nosnippet';
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login']);

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

function basicAuthOk(request: NextRequest, cfg: GateConfig): boolean {
  const credentials = parseBasicAuth(request.headers.get('authorization'));
  if (!credentials) return false;
  const userOk = constantTimeEqual(credentials.user, cfg.user);
  const passwordOk = constantTimeEqual(credentials.password, cfg.password);
  return userOk && passwordOk;
}

function withHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Robots-Tag', NO_INDEX);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Liveness probe for container healthchecks; returns no data.
  if (pathname === '/healthz') {
    return NextResponse.next();
  }

  if (gateBypassed()) {
    if (pathname === '/login')
      return withHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', NO_INDEX);
    return res;
  }

  const cfg = gateConfig();
  if (!cfg) {
    return new NextResponse('Admin console is locked: access gate is not configured.', {
      status: 503,
      headers: { 'X-Robots-Tag': NO_INDEX, 'Cache-Control': 'no-store' },
    });
  }

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, cfg);
  const authed = session !== null || basicAuthOk(request, cfg);

  if (PUBLIC_PATHS.has(pathname)) {
    if (authed && pathname === '/login') {
      const next = safeNextPath(request.nextUrl.searchParams.get('next'));
      return withHeaders(NextResponse.redirect(new URL(next, request.url)));
    }
    return withHeaders(NextResponse.next());
  }

  if (!authed) {
    if (pathname.startsWith('/api/')) {
      return withHeaders(
        NextResponse.json(
          { success: false, error: 'Your admin session has expired. Please sign in again.' },
          { status: 401 }
        )
      );
    }
    const login = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '/dashboard')
      login.searchParams.set('next', `${pathname}${search}`);
    const res = NextResponse.redirect(login);
    // Drop a stale or tampered cookie.
    if (request.cookies.has(SESSION_COOKIE)) res.cookies.delete(SESSION_COOKIE);
    return withHeaders(res);
  }

  return withHeaders(NextResponse.next());
}

export const config = {
  // Everything except Next.js build assets.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
