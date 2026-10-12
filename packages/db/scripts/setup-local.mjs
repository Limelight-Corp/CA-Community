#!/usr/bin/env node
/**
 * One-time (and safe to re-run) setup of the PostgreSQL database for the web and admin apps.
 *
 *   npm run setup --workspace=@ascend/db
 *
 * Needs packages/db/.env with a superuser connection, e.g.
 *   DATABASE_MIGRATION_URL="postgresql://postgres:<password>@localhost:5432/postgres"
 *
 * Steps: create database `ascend` → apply Prisma migrations → apply sql/10-constraints.sql and
 * sql/20-security.sql → give the app roles (ascend_web, ascend_admin) random passwords → write
 * DATABASE_URL into apps/web/.env.local and apps/admin/.env.local. Existing session secrets from
 * the old JSON stores are copied to MEMBER_SESSION_SECRET / ADMIN_SESSION_SECRET so people who
 * are signed in stay signed in. No password or secret is ever printed.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readEnvFile, upsertEnv, withDatabase } from './env.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, '..');
const root = path.resolve(pkg, '../..');
const DB_NAME = process.env.ASCEND_DB_NAME || 'ascend';

const env = { ...readEnvFile(path.join(pkg, '.env')), ...process.env };
const superUrl = env.DATABASE_MIGRATION_URL;
if (!superUrl) {
  console.error('setup: set DATABASE_MIGRATION_URL in packages/db/.env (a superuser connection to the "postgres" database).');
  process.exit(1);
}
const ownerUrl = withDatabase(superUrl, DB_NAME);

const { PrismaClient } = await import('../generated/client/index.js');

async function run(url, fn) {
  const db = new PrismaClient({ datasourceUrl: url, log: ['error'] });
  try {
    return await fn(db);
  } finally {
    await db.$disconnect();
  }
}

// 1. Database
await run(superUrl, async (db) => {
  const exists = await db.$queryRaw`SELECT 1 AS ok FROM pg_database WHERE datname = ${DB_NAME}`;
  if (exists.length) console.log(`✓ database "${DB_NAME}" exists`);
  else {
    // Identifier cannot be a bind parameter; DB_NAME is checked to be a plain name.
    if (!/^[a-z_][a-z0-9_]*$/.test(DB_NAME)) throw new Error('invalid ASCEND_DB_NAME');
    await db.$executeRawUnsafe(`CREATE DATABASE "${DB_NAME}" ENCODING 'UTF8'`);
    console.log(`✓ database "${DB_NAME}" created`);
  }
});

// 2. Prisma migrations + 3. constraints and security (all idempotent)
// Run the Prisma CLI through node directly (no shell) and pass the connection only through the
// environment, so the password never appears on a command line or in the process list.
const prismaCli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js');
const prismaEnv = { ...process.env, DATABASE_URL: ownerUrl, DATABASE_MIGRATION_URL: ownerUrl };
const prisma = (args) => execFileSync(process.execPath, [prismaCli, ...args], { cwd: pkg, env: prismaEnv, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
prisma(['migrate', 'deploy', '--schema', 'prisma/schema.prisma']);
console.log('✓ tables created / up to date (prisma migrate deploy)');
for (const file of ['sql/10-constraints.sql', 'sql/20-security.sql']) {
  prisma(['db', 'execute', '--schema', 'prisma/schema.prisma', '--file', file]);
  console.log(`✓ applied ${file}`);
}

// 4. App role passwords (kept if the app's .env.local already has a working one)
const apps = [
  { role: 'ascend_web', file: path.join(root, 'apps/web/.env.local'), limit: 10 },
  { role: 'ascend_admin', file: path.join(root, 'apps/admin/.env.local'), limit: 5 },
];
const su = new URL(ownerUrl);
await run(ownerUrl, async (db) => {
  await db.$executeRawUnsafe(`REVOKE CONNECT ON DATABASE "${DB_NAME}" FROM PUBLIC`);
  for (const app of apps) {
    const current = readEnvFile(app.file).DATABASE_URL;
    let password;
    try {
      const u = current ? new URL(current) : null;
      if (u && decodeURIComponent(u.username) === app.role && u.pathname === `/${DB_NAME}`) password = decodeURIComponent(u.password);
    } catch {
      /* not a URL — replace it */
    }
    password ||= crypto.randomBytes(24).toString('hex');
    // Hex only, so it is safe inside the quoted literal.
    await db.$executeRawUnsafe(`ALTER ROLE ${app.role} WITH LOGIN PASSWORD '${password}'`);
    await db.$executeRawUnsafe(`GRANT CONNECT ON DATABASE "${DB_NAME}" TO ${app.role}`);
    const url = `postgresql://${app.role}:${password}@${su.host}/${DB_NAME}?schema=public&connection_limit=${app.limit}`;
    upsertEnv(app.file, { DATABASE_URL: url });
    console.log(`✓ ${app.role}: password set, DATABASE_URL written to ${path.relative(root, app.file)}`);
  }
});

// 5. Session secrets: keep current sessions valid by reusing the JSON stores' secrets.
function jsonSecret(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')).sessionSecret || null;
  } catch {
    return null;
  }
}
for (const [file, key, source] of [
  [path.join(root, 'apps/web/.env.local'), 'MEMBER_SESSION_SECRET', path.join(root, 'data/member-accounts.json')],
  [path.join(root, 'apps/admin/.env.local'), 'ADMIN_SESSION_SECRET', path.join(root, 'data/admin-users.json')],
]) {
  if (readEnvFile(file)[key]) {
    console.log(`✓ ${key} already set`);
    continue;
  }
  const secret = jsonSecret(source) || crypto.randomBytes(32).toString('hex');
  upsertEnv(file, { [key]: secret });
  console.log(`✓ ${key} written to ${path.relative(root, file)}`);
}

console.log('\nDone. Next: npm run import --workspace=@ascend/db   (copies data/*.json into PostgreSQL)');
