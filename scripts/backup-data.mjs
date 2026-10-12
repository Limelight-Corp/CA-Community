#!/usr/bin/env node
/**
 * Backs up everything the site stores (checklist §23 "Regular backups"):
 *   ascend.dump            the PostgreSQL database (pg_dump, custom format — restore with pg_restore):
 *                          content, bookings, members, messages, admin + member accounts
 *   data/resource-files/   uploaded resource documents
 *   data/member-photos/    member profile photos
 * into <BACKUP_DIR or ./backups>/<timestamp>/ and keeps the newest BACKUP_KEEP (default 14).
 *
 *   npm run backup                 one backup now
 *   BACKUP_DIR=D:\ascend-backups npm run backup
 *
 * The database connection comes from BACKUP_DATABASE_URL or packages/db/.env
 * (DATABASE_MIGRATION_URL, database name replaced by "ascend"). pg_dump is taken from PG_DUMP, the
 * PATH, or the standard Windows install folder. The password goes to pg_dump through the
 * environment, never the command line.
 *
 * The web server also runs this once a day (src/instrumentation.ts). Backups contain personal
 * data and password hashes — keep them private, and copy them off this machine regularly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readEnvFile, withDatabase } from '../packages/db/scripts/env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const backupRoot = path.resolve(root, process.env.BACKUP_DIR || 'backups');
const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
const NAME = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/; // only folders this script created are ever pruned

if (!fs.existsSync(dataDir)) {
  console.error(`backup: no data directory at ${dataDir}`);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z').replace(/:/g, '-');
const target = path.join(backupRoot, stamp);
fs.mkdirSync(target, { recursive: true, mode: 0o700 });

let files = 0;
let bytes = 0;
const copy = (from, to) => {
  fs.copyFileSync(from, to);
  files += 1;
  bytes += fs.statSync(to).size;
};

// 1. Database
function findPgDump() {
  if (process.env.PG_DUMP) return process.env.PG_DUMP;
  if (process.platform === 'win32') {
    const base = 'C:\\Program Files\\PostgreSQL';
    if (fs.existsSync(base)) {
      const versions = fs.readdirSync(base).filter((v) => /^\d+$/.test(v)).sort((a, b) => Number(b) - Number(a));
      for (const v of versions) {
        const exe = path.join(base, v, 'bin', 'pg_dump.exe');
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  return 'pg_dump';
}
let dbOk = false;
const migrationUrl = readEnvFile(path.join(root, 'packages/db/.env')).DATABASE_MIGRATION_URL;
const dbUrl = process.env.BACKUP_DATABASE_URL || (migrationUrl ? withDatabase(migrationUrl, process.env.ASCEND_DB_NAME || 'ascend') : '');
if (dbUrl) {
  const u = new URL(dbUrl);
  const out = path.join(target, `${u.pathname.slice(1) || 'ascend'}.dump`);
  try {
    execFileSync(findPgDump(), ['--format=custom', '--no-owner', '--file', out, '--host', u.hostname, '--port', u.port || '5432', '--username', decodeURIComponent(u.username), u.pathname.slice(1)], {
      env: { ...process.env, PGPASSWORD: decodeURIComponent(u.password) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    files += 1;
    bytes += fs.statSync(out).size;
    dbOk = true;
  } catch (err) {
    console.error(`backup: database dump FAILED — ${(err.stderr?.toString() || err.message).trim().split('\n')[0]}`);
  }
} else {
  console.error('backup: no database connection configured (BACKUP_DATABASE_URL or packages/db/.env) — database NOT backed up');
}

// 2. Uploaded files
for (const sub of ['resource-files', 'member-photos']) {
  const from = path.join(dataDir, sub);
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.join(target, sub), { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const full = path.join(from, name);
    if (fs.statSync(full).isFile()) copy(full, path.join(target, sub, name));
  }
}

// Retention: remove the oldest backups this script created beyond `keep`.
const existing = fs
  .readdirSync(backupRoot)
  .filter((n) => NAME.test(n) && fs.statSync(path.join(backupRoot, n)).isDirectory())
  .sort();
const pruned = existing.slice(0, Math.max(0, existing.length - keep));
for (const n of pruned) fs.rmSync(path.join(backupRoot, n), { recursive: true, force: true });

console.log(
  `backup: ${dbOk ? 'database + ' : ''}${files} file(s), ${(bytes / 1024).toFixed(1)} KB → ${target}` + (pruned.length ? ` (removed ${pruned.length} old backup(s))` : '')
);
if (!dbOk) process.exitCode = 1;
