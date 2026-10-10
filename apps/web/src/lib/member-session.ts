/**
 * Member sessions (server only, except the small path helpers at the bottom).
 *
 * A session is an httpOnly cookie holding `base64url(payload).hmac`, where the payload is
 * { uid, v, iat, exp } and the HMAC-SHA256 key is the secret in data/member-accounts.json.
 * `v` must match the account's `sessionVersion`, so changing or resetting the password signs
 * out every other session. The browser never sees or stores a token itself.
 */
import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import { findAccountById, sessionSecret, type MemberAccount } from './member-accounts';

export const MEMBER_SESSION_COOKIE = 'ascend_member_session';
const MAX_AGE = 30 * 24 * 3600; // 30 days

interface Payload {
  uid: string;
  v: number;
  iat: number;
  exp: number;
}

const sign = (data: string) => crypto.createHmac('sha256', sessionSecret()).update(data).digest('base64url');

export function createSessionToken(account: Pick<MemberAccount, 'id' | 'sessionVersion'>): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Payload = { uid: account.id, v: account.sessionVersion, iat: now, exp: now + MAX_AGE };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

/** Returns the signed-in account, or null for a missing, forged, expired or revoked session. */
export function accountFromSessionToken(token: string | undefined | null): MemberAccount | null {
  if (!token || token.length > 1000) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as Payload;
  } catch {
    return null;
  }
  if (!payload.uid || typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
  const account = findAccountById(payload.uid);
  if (!account || account.sessionVersion !== payload.v) return null;
  return account;
}

/** Signed-in account for a server component / server action. */
export async function currentMember(): Promise<MemberAccount | null> {
  return accountFromSessionToken((await cookies()).get(MEMBER_SESSION_COOKIE)?.value);
}

/** Signed-in account for a route handler. */
export function memberFromRequest(req: Request): MemberAccount | null {
  const header = req.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq !== -1 && part.slice(0, eq).trim() === MEMBER_SESSION_COOKIE) {
      return accountFromSessionToken(decodeURIComponent(part.slice(eq + 1).trim()));
    }
  }
  return null;
}

/** True when the request reached us over HTTPS (directly or via a TLS-terminating proxy). */
function isHttps(req: Request): boolean {
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  return proto ? proto === 'https' : new URL(req.url).protocol === 'https:';
}

/** Sets the session cookie; `Secure` whenever the site is served over HTTPS. */
export function setSessionCookie(res: NextResponse, account: Pick<MemberAccount, 'id' | 'sessionVersion'>, req: Request): void {
  res.cookies.set(MEMBER_SESSION_COOKIE, createSessionToken(account), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps(req),
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(MEMBER_SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  // Cookie from the old prototype login.
  res.cookies.set('ascend_member_token', '', { path: '/', maxAge: 0 });
}

export { loginUrl, safeNextPath } from './auth-paths';
