#!/usr/bin/env node
/**
 * Creates or updates a member account in data/member-accounts.json (gitignored).
 *
 *   npm run member:seed -- --email you@example.com [--password '<password>'] [--name 'CA Full Name'] [--mobile 9876543210] [--unverified]
 *
 * Accounts are created with a confirmed email unless --unverified is given. Without --password,
 * a new account gets a random password that is printed once; an existing account keeps its
 * password. Changing a password signs that member out everywhere.
 * The hash format must match apps/web/src/lib/member-accounts.ts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'member-accounts.json');

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

const store = fs.existsSync(file)
  ? JSON.parse(fs.readFileSync(file, 'utf-8'))
  : { sessionSecret: crypto.randomBytes(32).toString('hex'), accounts: [] };
const now = new Date().toISOString();
let account = store.accounts.find((a) => a.email === email);
let generated = null;

if (!account) {
  const password = args.password || (generated = `${crypto.randomBytes(9).toString('base64url')}7a`);
  account = {
    id: `acct-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    name: args.name || 'CA Test Member',
    email,
    mobile: args.mobile || undefined,
    passwordHash: hashPassword(password),
    emailVerifiedAt: args.unverified ? undefined : now,
    sessionVersion: 1,
    profile: {},
    createdAt: now,
    updatedAt: now,
  };
  store.accounts.push(account);
} else {
  if (args.name) account.name = args.name;
  if (args.mobile) account.mobile = args.mobile;
  if (args.password) {
    account.passwordHash = hashPassword(args.password);
    account.sessionVersion = (account.sessionVersion || 1) + 1;
  }
  account.emailVerifiedAt = args.unverified ? undefined : account.emailVerifiedAt || now;
  account.updatedAt = now;
}

fs.mkdirSync(path.dirname(file), { recursive: true });
const tmp = `${file}.${process.pid}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { encoding: 'utf-8', mode: 0o600 });
fs.renameSync(tmp, file);

console.log(`member:seed: ${account.email} (${account.name}) — email ${account.emailVerifiedAt ? 'confirmed' : 'not confirmed'}`);
if (generated) console.log(`member:seed: generated password (shown once): ${generated}`);
