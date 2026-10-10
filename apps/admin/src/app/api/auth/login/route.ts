import { NextRequest, NextResponse } from 'next/server';
import { FailureThrottle, clientIpFromHeaders } from '@ascend/shared';
import { bad, isPlainObject } from '../../../../lib/api-helpers';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  constantTimeEqual,
  createSessionToken,
  gateConfig,
  safeNextPath,
  signInConfigured,
} from '../../../../lib/admin-session';
import { authenticateAdmin, recordAdminLogin } from '../../../../lib/admin-users';
import { sameOrigin } from '../same-origin';

export const dynamic = 'force-dynamic';

/**
 * In-memory brute-force brake, counted both per username (5 failures / 15 min) and per client IP
 * (20 / 15 min). The IP comes from our proxy, so a forged X-Forwarded-For cannot reset it.
 */
const WINDOW_MS = 15 * 60 * 1000;
const byUser = new FailureThrottle(5, WINDOW_MS);
const byIp = new FailureThrottle(20, WINDOW_MS);

function isHttps(request: NextRequest): boolean {
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return proto ? proto === 'https' : request.nextUrl.protocol === 'https:';
}

function tooMany(minutes: number) {
  return bad(`Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, 429);
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return bad('Cross-site sign-in is not allowed.', 403);

  if (!signInConfigured()) return bad('Admin sign-in is not configured on this server.', 503);

  const ipKey = clientIpFromHeaders(request.headers);
  const ipMinutes = byIp.lockedFor(ipKey);
  if (ipMinutes > 0) return tooMany(ipMinutes);

  const body = await request.json().catch(() => null);
  if (!isPlainObject(body)) return bad('Invalid request.');
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || !password) {
    return bad('Enter your username and password.', 400, {
      ...(username ? {} : { username: 'Username is required' }),
      ...(password ? {} : { password: 'Password is required' }),
    });
  }
  const userKey = username.toLowerCase();
  const userMinutes = byUser.lockedFor(userKey);
  if (userMinutes > 0) return tooMany(userMinutes);

  // Accounts in the admin store first, then the environment credentials as a fallback.
  const dbUser = authenticateAdmin(username, password);
  const cfg = gateConfig();
  const envOk =
    !dbUser &&
    cfg !== null &&
    constantTimeEqual(username, cfg.user) &&
    constantTimeEqual(password, cfg.password);
  if (!dbUser && !envOk) {
    byIp.fail(ipKey);
    const left = byUser.fail(userKey);
    await new Promise((r) => setTimeout(r, 400));
    return left > 0 ? bad('Incorrect username or password.', 401) : tooMany(15);
  }

  byUser.clear(userKey);
  if (dbUser) recordAdminLogin(dbUser.id);
  const token = dbUser
    ? await createSessionToken(dbUser.username, 'db')
    : await createSessionToken(cfg!.user, 'env');
  const res = NextResponse.json({
    success: true,
    data: { next: safeNextPath(typeof body.next === 'string' ? body.next : null) },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    // Behind the TLS-terminating proxy the request URL is http:, so trust nginx's X-Forwarded-Proto.
    secure: isHttps(request),
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
