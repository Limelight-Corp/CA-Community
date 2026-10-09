import { NextRequest, NextResponse } from 'next/server';
import { bad, isPlainObject } from '../../../../lib/api-helpers';
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  constantTimeEqual,
  createSessionToken,
  gateConfig,
  safeNextPath,
} from '../../../../lib/admin-session';
import { sameOrigin } from '../same-origin';

export const dynamic = 'force-dynamic';

/** In-memory brute-force brake: 5 failed attempts per client per 15 minutes. */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const failures = new Map<string, { count: number; first: number }>();

function clientKey(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  );
}

function lockedFor(key: string): number {
  const entry = failures.get(key);
  if (!entry) return 0;
  const elapsed = Date.now() - entry.first;
  if (elapsed > WINDOW_MS) {
    failures.delete(key);
    return 0;
  }
  return entry.count >= MAX_FAILURES ? Math.ceil((WINDOW_MS - elapsed) / 60000) : 0;
}

function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS)
    failures.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return bad('Cross-site sign-in is not allowed.', 403);

  const cfg = gateConfig();
  if (!cfg) return bad('Admin sign-in is not configured on this server.', 503);

  const key = clientKey(request);
  const minutes = lockedFor(key);
  if (minutes > 0) {
    return bad(
      `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
      429
    );
  }

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

  const userOk = constantTimeEqual(username, cfg.user);
  const passwordOk = constantTimeEqual(password, cfg.password);
  if (!userOk || !passwordOk) {
    recordFailure(key);
    await new Promise((r) => setTimeout(r, 400));
    const left = MAX_FAILURES - (failures.get(key)?.count ?? 0);
    return bad(
      left > 0
        ? `Incorrect username or password. ${left} attempt${left === 1 ? '' : 's'} left.`
        : 'Too many failed attempts. Try again in 15 minutes.',
      left > 0 ? 401 : 429
    );
  }

  failures.delete(key);
  const res = NextResponse.json({
    success: true,
    data: { next: safeNextPath(typeof body.next === 'string' ? body.next : null) },
  });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(cfg), {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' && request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
