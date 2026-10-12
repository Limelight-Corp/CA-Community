#!/usr/bin/env node
/**
 * Creates or updates a member account in PostgreSQL (tables member_accounts / member_profiles;
 * connection from DATABASE_URL in apps/web/.env.local).
 *
 *   npm run member:seed -- --email you@example.com [--password '<password>'] [--name 'CA Full Name'] [--mobile 9876543210] [--unverified]
 *
 * Accounts are created with a confirmed email unless --unverified is given. Without --password,
 * a new account gets a random password that is printed once; an existing account keeps its
 * password. Changing a password signs that member out everywhere.
 * The hash format must match apps/web/src/lib/member-accounts.ts.
 */
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const [key, inline] = arg.slice(2).split('=', 2);
    if (key === 'unverified') out[key] = true;
    else out[key] = inline ?? argv[++i];
  }
  return out;
}

function fail(message) {
  console.error(`member:seed: ${message}`);
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

const args = parseArgs(process.argv.slice(2));
const email = String(args.email || '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('pass a valid --email');
if (args.password && (String(args.password).length < 8 || !/[A-Za-z]/.test(args.password) || !/\d/.test(args.password))) {
  fail('the password needs at least 8 characters with letters and a number');
}

const { readEnvFile } = await import('../packages/db/scripts/env.mjs');
const dbUrl = process.env.DATABASE_URL || readEnvFile(path.join(root, 'apps/web/.env.local')).DATABASE_URL;
if (!dbUrl) fail('DATABASE_URL is not set (run `npm run setup --workspace=@ascend/db` first)');
const { PrismaClient } = await import('../packages/db/generated/client/index.js');
const db = new PrismaClient({ datasourceUrl: dbUrl, log: ['error'] });

const now = new Date();
let generated = null;
let account = await db.memberAccount.findUnique({ where: { email } });
if (!account) {
  const password = args.password || (generated = `${crypto.randomBytes(9).toString('base64url')}7a`);
  account = await db.memberAccount.create({
    data: {
      name: args.name || 'CA Test Member',
      email,
      mobile: args.mobile || null,
      passwordHash: hashPassword(password),
      emailVerifiedAt: args.unverified ? null : now,
      profile: { create: {} },
    },
  });
} else {
  account = await db.memberAccount.update({
    where: { id: account.id },
    data: {
      name: args.name || undefined,
      mobile: args.mobile || undefined,
      ...(args.password ? { passwordHash: hashPassword(args.password), sessionVersion: { increment: 1 } } : {}),
      emailVerifiedAt: args.unverified ? null : account.emailVerifiedAt || now,
    },
  });
}
await db.$disconnect();

console.log(`member:seed: ${account.email} (${account.name}) — email ${account.emailVerifiedAt ? 'confirmed' : 'not confirmed'}`);
if (generated) console.log(`member:seed: generated password (shown once): ${generated}`);
