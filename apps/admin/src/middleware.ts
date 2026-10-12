import { NextRequest, NextResponse } from 'next/server';
import { clientIpFromHeaders } from '@ascend/shared';
import { SharedFailureThrottle } from '@ascend/db';
import {
  SESSION_COOKIE,
  constantTimeEqual,
  gateBypassed,
  gateConfig,
  safeNextPath,
  verifySessionToken,
} from './lib/admin-session';
import { authenticateAdmin } from './lib/admin-users';
import { sameOrigin } from './app/api/auth/same-origin';

/**
 * Admin access gate.
 *
 * The admin console does not yet use the API's real admin authentication (password + TOTP).
 * Every request — pages and `/api/*` routes alike — needs a signed session cookie issued by
 * the sign-in page at /login, which checks admin accounts in the admin_users table (created
 * with `npm run admin:seed`) and, as a fallback, credentials from the environment:
 *
 *   ADMIN_GATE_USER, ADMIN_GATE_PASSWORD  (optional: ADMIN_SESSION_SECRET)
 *
 * Runs on the Node.js runtime so each session is checked against the account store.
 *
 * HTTP Basic credentials are still accepted for scripted access, but the browser is no longer
 * prompted for them. The gate fails closed: when no admin account or credentials exist, nobody
 * can sign in and every page redirects to /login. For local development only,
 * ADMIN_GATE_DISABLED=true bypasses the gate; it is ignored when NODE_ENV=production.
 */

const NO_INDEX = 'noindex, nofollow, noarchive, nosnippet';
const PUBLIC_PATHS = new Set(['/login', '/api/auth/login']);
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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

/** Basic-auth guessing brake (per client IP and per username), checked before any password hashing. */
const basicByIp = new SharedFailureThrottle('admin-ip', 20, 15 * 60 * 1000);
const basicByUser = new SharedFailureThrottle('admin-user', 5, 15 * 60 * 1000);

async function basicAuthOk(request: NextRequest): Promise<boolean> {
  const credentials = parseBasicAuth(request.headers.get('authorization'));
  if (!credentials) return false;
  const ip = clientIpFromHeaders(request.headers);
  const user = credentials.user.toLowerCase();
  if ((await basicByIp.lockedFor(ip)) > 0 || (await basicByUser.lockedFor(user)) > 0) return false;
  const cfg = gateConfig();
  let ok = false;
  if (cfg) {
    const userOk = constantTimeEqual(credentials.user, cfg.user);
    const passwordOk = constantTimeEqual(credentials.password, cfg.password);
    ok = userOk && passwordOk;
  }
  if (!ok) ok = (await authenticateAdmin(credentials.user, credentials.password)) !== null;
  if (ok) await basicByUser.clear(user);
  else {
    await basicByIp.fail(ip);
    await basicByUser.fail(user);
  }
  return ok;
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

  // Every state-changing request must come from this admin site itself (defence in depth next to
  // the SameSite=Strict session cookie). Scripts without an Origin header are still allowed.
  if (!SAFE_METHODS.has(request.method) && (!sameOrigin(request) || request.headers.get('sec-fetch-site') === 'cross-site')) {
    return withHeaders(NextResponse.json({ success: false, error: 'Cross-site request refused.' }, { status: 403 }));
  }

  // Without an admin account or credentials nobody can be signed in: every page leads to
  // /login, which explains that sign-in is not set up yet.
  const authed =
    (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) !== null ||
    (await basicAuthOk(request));

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
  runtime: 'nodejs',
  // Everything except Next.js build assets.
  matcher: ['/((?!_next/static|_next/image).*)'],
};
