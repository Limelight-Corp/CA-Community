/**
 * Admin accounts (server-only), stored in PostgreSQL (table admin_users — see packages/db).
 *
 * Passwords are stored as `scrypt$N$r$p$<salt>$<hash>` (base64url) and checked with async scrypt
 * so a login never blocks the server. Accounts are created with `npm run admin:seed`. The session
 * signing secret is ADMIN_SESSION_SECRET (env), never stored in the database.
 */
import crypto from 'crypto';
import { promisify } from 'util';
import { prisma, type AdminUser as DbAdminUser } from '@ascend/db';

export type AdminRole = 'super_admin' | 'admin';

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  passwordHash: string;
  active: boolean;
  /** Unix seconds; sessions issued before this are rejected. */
  passwordChangedAt: number;
  createdAt: string;
  lastLoginAt?: string;
}

function toAdmin(u: DbAdminUser): AdminUser {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role === 'SUPER_ADMIN' ? 'super_admin' : 'admin',
    passwordHash: u.passwordHash,
    active: u.active,
    passwordChangedAt: Math.floor(u.passwordChangedAt.getTime() / 1000),
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString(),
  };
}

/** Case-insensitive (username is citext). */
export async function findAdmin(username: string): Promise<AdminUser | undefined> {
  const key = username.trim();
  if (!key || key.length > 80) return undefined;
  const u = await prisma.adminUser.findUnique({ where: { username: key } });
  return u ? toAdmin(u) : undefined;
}

export async function hasAdminAccounts(): Promise<boolean> {
  return (await prisma.adminUser.count({ where: { active: true } })) > 0;
}

const scrypt = promisify(crypto.scrypt) as (pw: crypto.BinaryLike, salt: crypto.BinaryLike, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

/** Verifies a password against a stored scrypt hash in constant time. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, hash] = parts as [string, string, string, string, string, string];
  try {
    const expected = Buffer.from(hash, 'base64url');
    const actual = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** A hash to compare against when the username is unknown, so timing does not reveal it. */
const DUMMY_HASH = `scrypt$16384$8$1$${Buffer.alloc(16).toString('base64url')}$${Buffer.alloc(64).toString('base64url')}`;

export async function authenticateAdmin(username: string, password: string): Promise<AdminUser | null> {
  const user = await findAdmin(username);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return ok && user && user.active ? user : null;
}

export async function recordAdminLogin(id: string): Promise<void> {
  try {
    await prisma.adminUser.update({ where: { id }, data: { lastLoginAt: new Date() } });
  } catch (err) {
    console.error('Failed to record admin login:', (err as Error).message);
  }
}
