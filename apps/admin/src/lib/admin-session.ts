/**
 * Signed admin session cookie (Web Crypto, so it runs in middleware and route handlers).
 *
 * Credentials still come from ADMIN_GATE_USER / ADMIN_GATE_PASSWORD. A successful sign-in sets
 * an httpOnly cookie `<payload>.<HMAC-SHA256>` where payload = base64url({ u, exp }).
 *
 * The HMAC key is ADMIN_SESSION_SECRET when set (recommended in production). Otherwise it is
 * derived from the gate credentials, so changing the password signs everyone out.
 */

export const SESSION_COOKIE = 'ascend_admin_session';
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

export interface AdminSession {
  u: string;
  exp: number;
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

async function hmacKey(cfg: GateConfig): Promise<CryptoKey> {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    `ascend-admin-session\u0000${cfg.user}\u0000${cfg.password}`;
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function sign(payload: string, cfg: GateConfig): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(cfg), enc.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

export async function createSessionToken(cfg: GateConfig): Promise<string> {
  const session: AdminSession = {
    u: cfg.user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const payload = toBase64Url(enc.encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload, cfg)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  cfg: GateConfig
): Promise<AdminSession | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!constantTimeEqual(sig, await sign(payload, cfg))) return null;
  try {
    const session = JSON.parse(fromBase64Url(payload)) as AdminSession;
    if (typeof session.u !== 'string' || typeof session.exp !== 'number') return null;
    if (session.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!constantTimeEqual(session.u, cfg.user)) return null;
    return session;
  } catch {
    return null;
  }
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\'))
    return '/dashboard';
  if (next.startsWith('/login') || next.startsWith('/api/')) return '/dashboard';
  return next;
}
