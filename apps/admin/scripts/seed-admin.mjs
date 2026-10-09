#!/usr/bin/env node
/**
 * Creates or updates an admin account in data/admin-users.json (gitignored).
 *
 *   npm run admin:seed -- --username admin --password '<password>' [--name 'Full Name'] [--role super_admin|admin]
 *
 * Values can also come from ADMIN_SEED_USERNAME / ADMIN_SEED_PASSWORD / ADMIN_SEED_NAME / ADMIN_SEED_ROLE.
 * Without a password, a new account gets a random one that is printed once; an existing
 * account keeps its password. Changing a password signs that admin out everywhere.
 */
import fs from 'node:fs';
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

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../data');
if (!fs.existsSync(dataDir)) fail(`data directory not found: ${dataDir}`);
const file = path.join(dataDir, 'admin-users.json');

let store = { users: [] };
if (fs.existsSync(file)) {
  try {
    store = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (!Array.isArray(store.users)) store.users = [];
  } catch (err) {
    fail(`could not read ${file}: ${err.message}`);
  }
}
if (!store.sessionSecret) store.sessionSecret = crypto.randomBytes(32).toString('base64url');

const now = new Date();
const existing = store.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
let generated = false;

if (existing) {
  if (name) existing.name = name;
  if (role) existing.role = role;
  existing.active = true;
  if (password) {
    existing.passwordHash = hashPassword(password);
    existing.passwordChangedAt = Math.floor(now.getTime() / 1000);
  }
} else {
  if (!password) {
    password = crypto.randomBytes(15).toString('base64url');
    generated = true;
  }
  store.users.push({
    id: `adm-${now.getTime().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
    username,
    name: name || 'ASCEND Admin',
    role: role || (store.users.length === 0 ? 'super_admin' : 'admin'),
    passwordHash: hashPassword(password),
    active: true,
    passwordChangedAt: Math.floor(now.getTime() / 1000),
    createdAt: now.toISOString(),
  });
}

const tmp = `${file}.${process.pid}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { encoding: 'utf-8', mode: 0o600 });
fs.renameSync(tmp, file);

const user = store.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
console.log(
  `${existing ? 'Updated' : 'Created'} admin "${user.username}" (${user.role}) in ${path.relative(process.cwd(), file) || file}`
);
if (existing && !password) console.log('Password unchanged.');
if (existing && password)
  console.log('Password changed — existing sessions for this admin are signed out.');
if (generated) console.log(`Generated password (shown once, store it safely): ${password}`);
