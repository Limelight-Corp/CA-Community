#!/usr/bin/env node
/**
 * Loads TEST data for local development and testing.
 *
 *   npm run seed:test            # only fills what is missing
 *   npm run seed:test -- --force # replaces data/private-store.json (the old file is backed up)
 *
 * - data/seed/private-store.seed.json → data/private-store.json
 *   (test registrations, membership applications and messages; @example.com addresses only)
 * - the local development admin account (see README → Admin access), via the admin seed
 *
 * Refuses to run when NODE_ENV=production.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.env.NODE_ENV === 'production') {
  console.error('seed:test: refusing to load test data with NODE_ENV=production.');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const seedFile = path.join(dataDir, 'seed', 'private-store.seed.json');
const privateFile = path.join(dataDir, 'private-store.json');
const force = process.argv.includes('--force');

// 1. Private store (registrations, members, messages)
const seed = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
if (fs.existsSync(privateFile) && !force) {
  console.log('data/private-store.json already exists — left unchanged (use --force to replace it).');
} else {
  if (fs.existsSync(privateFile)) {
    const backup = path.join(dataDir, `private-store.backup-${Date.now()}.json`);
    fs.copyFileSync(privateFile, backup);
    console.log(`Backed up the existing private store to ${path.relative(root, backup)}`);
  }
  const tmp = `${privateFile}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(seed, null, 2), 'utf-8');
  fs.renameSync(tmp, privateFile);
  console.log(
    `Loaded test data: ${seed.registrations.length} registrations, ${seed.members.length} members, ${seed.messages.length} messages.`
  );
}

// 2. Local development admin account (only created if missing; an existing password is kept)
const adminFile = path.join(dataDir, 'admin-users.json');
const hasAdmin =
  fs.existsSync(adminFile) &&
  (JSON.parse(fs.readFileSync(adminFile, 'utf-8')).users ?? []).some((u) => u.username?.toLowerCase() === 'admin');
if (hasAdmin) {
  console.log('Admin account "admin" already exists — left unchanged.');
} else {
  const res = spawnSync(
    process.execPath,
    [
      path.join(root, 'apps', 'admin', 'scripts', 'seed-admin.mjs'),
      '--username',
      'admin',
      '--password',
      'Admin@Ascend2027!',
      '--name',
      'ASCEND Admin',
    ],
    { stdio: 'inherit' }
  );
  if (res.status !== 0) process.exit(res.status ?? 1);
}
