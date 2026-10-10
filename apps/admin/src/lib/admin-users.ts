/**
 * Admin accounts (server-only): data/admin-users.json — gitignored, never served.
 *
 * {
 *   "sessionSecret": "<random, signs admin session cookies>",
 *   "users": [{ id, username, name, role, passwordHash, active, passwordChangedAt, createdAt, lastLoginAt }]
 * }
 *
 * Passwords are stored as `scrypt$N$r$p$<salt>$<hash>` (base64url). Accounts are created with
 * `npm run admin:seed` (apps/admin/scripts/seed-admin.mjs uses the same format).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

export interface AdminStore {
  sessionSecret?: string;
  users: AdminUser[];
}

function adminFile(): string {
  const candidates = [
    path.resolve(process.cwd(), '../../data'),
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), 'data'),
  ];
  const dir =
    candidates.find((d) => fs.existsSync(path.join(d, 'community-store.json'))) ?? candidates[0]!;
  return path.join(dir, 'admin-users.json');
}

let cache: { mtimeMs: number; data: AdminStore } | null = null;

export function readAdminStore(): AdminStore {
  const file = adminFile();
  try {
    const { mtimeMs } = fs.statSync(file);
    if (cache && cache.mtimeMs === mtimeMs) return cache.data;
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as Partial<AdminStore>;
    const data: AdminStore = {
      sessionSecret: raw.sessionSecret,
      users: Array.isArray(raw.users) ? raw.users : [],
    };
    cache = { mtimeMs, data };
    return data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT')
      console.error('Failed to read admin-users.json:', err);
    return { users: [] };
  }
}

function writeAdminStore(data: AdminStore): void {
  const file = adminFile();
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmp, file);
  cache = null;
}

export function findAdmin(username: string): AdminUser | undefined {
  const key = username.trim().toLowerCase();
  return readAdminStore().users.find((u) => u.username.toLowerCase() === key);
}

export function hasAdminAccounts(): boolean {
  return readAdminStore().users.some((u) => u.active);
}

/** Verifies a password against a stored scrypt hash in constant time. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, hash] = parts as [string, string, string, string, string, string];
  try {
    const expected = Buffer.from(hash, 'base64url');
    const actual = crypto.scryptSync(password, Buffer.from(salt, 'base64url'), expected.length, {
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

export function authenticateAdmin(username: string, password: string): AdminUser | null {
  const user = findAdmin(username);
  const ok = verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return ok && user && user.active ? user : null;
}

export function recordAdminLogin(id: string): void {
  try {
    const data = readAdminStore();
    const user = data.users.find((u) => u.id === id);
    if (!user) return;
    user.lastLoginAt = new Date().toISOString();
    writeAdminStore({ ...data, users: data.users.map((u) => (u.id === id ? user : u)) });
  } catch (err) {
    console.error('Failed to record admin login:', err);
  }
}
