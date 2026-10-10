#!/usr/bin/env node
/**
 * Backs up everything the site stores on disk (checklist §23 "Regular backups"):
 *   data/*.json            content, registrations, members, messages, admin + member accounts
 *   data/resource-files/   uploaded resource documents
 *   data/member-photos/    member profile photos
 * into <BACKUP_DIR or ./backups>/<timestamp>/ and keeps the newest BACKUP_KEEP (default 14).
 *
 *   npm run backup                 one backup now
 *   BACKUP_DIR=D:\ascend-backups npm run backup
 *
 * The web server also runs this once a day (src/instrumentation.ts). Backups contain personal
 * data and password hashes — keep them private, and copy them off this machine regularly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

for (const name of fs.readdirSync(dataDir)) {
  const full = path.join(dataDir, name);
  if (name.endsWith('.json') && !name.includes('.backup-') && fs.statSync(full).isFile()) copy(full, path.join(target, name));
}
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
  `backup: ${files} file(s), ${(bytes / 1024).toFixed(1)} KB → ${target}` + (pruned.length ? ` (removed ${pruned.length} old backup(s))` : '')
);
