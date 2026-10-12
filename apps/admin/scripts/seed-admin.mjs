#!/usr/bin/env node
/**
 * Creates or updates an admin account in PostgreSQL (table admin_users; connection from
 * DATABASE_URL in apps/admin/.env.local, written by `npm run setup --workspace=@ascend/db`).
 *
 *   npm run admin:seed -- --username admin --password '<password>' [--name 'Full Name'] [--role super_admin|admin]
 *
 * Values can also come from ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD / ADMIN_SEED_NAME / ADMIN_SEED_ROLE.
 * Without a password, a new account gets a random one that is printed once; an existing
 * account keeps its password. Changing a password signs that admin out everywhere.
 */
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, inline] = arg.slice(2).split('=', 2);
    out[key] = inline ?? argv[++i];
  }
  return out;
}

function fail(message) {
  console.error(`admin:seed: ${message}`);
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, {
    N: SCRYPT.N,
    r: SCRYPT.r,
    p: SCRYPT.p,
  });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

const args = parseArgs(process.argv.slice(2));
const username = (args.username ?? process.env.ADMIN_SEED_USERNAME ?? 'admin').trim();
let password = args.password ?? process.env.ADMIN_SEED_PASSWORD;
const name = (args.name ?? process.env.ADMIN_SEED_NAME)?.trim();
const role = args.role ?? process.env.ADMIN_SEED_ROLE;

if (!/^[A-Za-z0-9._@-]{3,64}$/.test(username))
  fail('username must be 3–64 characters: letters, digits, . _ @ -');
if (role && role !== 'super_admin' && role !== 'admin') fail('role must be super_admin or admin');
if (password !== undefined && password.length < 10) fail('password must be at least 10 characters');

const here = path.dirname(fileURLToPath(import.meta.url));
const { readEnvFile } = await import('../../../packages/db/scripts/env.mjs');
const dbUrl = process.env.DATABASE_URL || readEnvFile(path.join(here, '../.env.local')).DATABASE_URL;
if (!dbUrl) fail('DATABASE_URL is not set (run `npm run setup --workspace=@ascend/db` first)');
const { PrismaClient } = await import('../../../packages/db/generated/client/index.js');
const db = new PrismaClient({ datasourceUrl: dbUrl, log: ['error'] });

const now = new Date();
let generated = false;
// username is citext in the database, so this lookup ignores letter case.
const existing = await db.adminUser.findUnique({ where: { username } });
let user;
if (existing) {
  user = await db.adminUser.update({
    where: { id: existing.id },
    data: {
      name: name || undefined,
      role: role ? role.toUpperCase() : undefined,
      active: true,
      ...(password ? { passwordHash: hashPassword(password), passwordChangedAt: now } : {}),
    },
  });
} else {
  if (!password) {
    password = crypto.randomBytes(15).toString('base64url');
    generated = true;
  }
  const first = (await db.adminUser.count()) === 0;
  user = await db.adminUser.create({
    data: {
      username,
      name: name || 'ASCEND Admin',
      role: (role || (first ? 'super_admin' : 'admin')).toUpperCase(),
      passwordHash: hashPassword(password),
      active: true,
      passwordChangedAt: now,
    },
  });
}
await db.$disconnect();

console.log(`${existing ? 'Updated' : 'Created'} admin "${user.username}" (${user.role.toLowerCase()}) in PostgreSQL`);
if (existing && !password) console.log('Password unchanged.');
if (existing && password) console.log('Password changed — existing sessions for this admin are signed out.');
if (generated) console.log(`Generated password (shown once, store it safely): ${password}`);
