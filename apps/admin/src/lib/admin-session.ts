/**
 * Signed admin session cookie (server-only: middleware runs on the Node.js runtime).
 *
 * Admins sign in with an account from data/admin-users.json (created by `npm run admin:seed`)
 * or, as a fallback, with ADMIN_GATE_USER / ADMIN_GATE_PASSWORD from the environment.
 * A successful sign-in sets an httpOnly cookie `<payload>.<HMAC-SHA256>` where
 * payload = base64url({ u, src, iat, exp }).
 *
 * HMAC key, in order: ADMIN_SESSION_SECRET, the store's sessionSecret (written by the seed),
 * or a key derived from the environment credentials.
 */
import { findAdmin, hasAdminAccounts, readAdminStore, type AdminRole } from './admin-users';

export const SESSION_COOKIE = 'ascend_admin_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface AdminSession {
  /** Username. */
  u: string;
  /** Where the account lives: the admin store or the environment. */
  src: 'db' | 'env';
  iat: number;
  exp: number;
}

export interface AdminIdentity {
  username: string;
  name: string;
  role: AdminRole;
  source: 'db' | 'env';
}

export interface GateConfig {
  user: string;
  password: string;
}

const enc = new TextEncoder();

export function gateConfig(): GateConfig | null {
  const user = process.env.ADMIN_GATE_USER;
  const password = process.env.ADMIN_GATE_PASSWORD;
  return user && password ? { user, password } : null;
}

/** True when at least one way to sign in exists (a stored admin or environment credentials). */
export function signInConfigured(): boolean {
  return hasAdminAccounts() || gateConfig() !== null;
}

/** Local development only: ADMIN_GATE_DISABLED=true. Ignored when NODE_ENV=production. */
export function gateBypassed(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ADMIN_GATE_DISABLED === 'true';
}

export function constantTimeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
}

function signingSecret(): string | null {
  if (process.env.ADMIN_SESSION_SECRET) return process.env.ADMIN_SESSION_SECRET;
  const stored = readAdminStore().sessionSecret;
  if (stored) return stored;
  const cfg = gateConfig();
  return cfg ? `ascend-admin-session\u0000${cfg.user}\u0000${cfg.password}` : null;
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

export async function createSessionToken(
  username: string,
  src: AdminSession['src']
): Promise<string> {
  const secret = signingSecret();
  if (!secret) throw new Error('No admin session signing secret is available');
  const now = Math.floor(Date.now() / 1000);
  const session: AdminSession = { u: username, src, iat: now, exp: now + SESSION_TTL_SECONDS };
  const payload = toBase64Url(enc.encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload, secret)}`;
}

/** Verifies the cookie and that the account still exists, is active and kept its password. */
export async function verifySessionToken(token: string | undefined): Promise<AdminIdentity | null> {
  if (!token) return null;
  const secret = signingSecret();
  if (!secret) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  if (!constantTimeEqual(token.slice(dot + 1), await sign(payload, secret))) return null;

  let session: AdminSession;
  try {
    session = JSON.parse(fromBase64Url(payload)) as AdminSession;
  } catch {
    return null;
  }
  if (
    typeof session.u !== 'string' ||
    typeof session.exp !== 'number' ||
    typeof session.iat !== 'number'
  )
    return null;
  if (session.exp <= Math.floor(Date.now() / 1000)) return null;

  if (session.src === 'db') {
    const user = findAdmin(session.u);
    if (!user || !user.active || session.iat < (user.passwordChangedAt ?? 0)) return null;
    return { username: user.username, name: user.name, role: user.role, source: 'db' };
  }
  if (session.src === 'env') {
    const cfg = gateConfig();
    if (!cfg || !constantTimeEqual(session.u, cfg.user)) return null;
    return { username: cfg.user, name: cfg.user, role: 'super_admin', source: 'env' };
  }
  return null;
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\'))
    return '/dashboard';
  if (next.startsWith('/login') || next.startsWith('/api/')) return '/dashboard';
  return next;
}
