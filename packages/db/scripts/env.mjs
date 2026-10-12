/** Tiny .env helpers for the db scripts (no dependency on dotenv). Values are never printed. */
import fs from 'node:fs';

export function readEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

/** Sets KEY=value lines in an env file, keeping every other line exactly as it was. */
export function upsertEnv(file, values) {
  const lines = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8').split(/\r?\n/) : [];
  const done = new Set();
  const next = lines.map((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (m && m[1] in values) {
      done.add(m[1]);
      return `${m[1]}="${values[m[1]]}"`;
    }
    return line;
  });
  const missing = Object.keys(values).filter((k) => !done.has(k));
  if (missing.length) {
    if (next.length && next[next.length - 1] !== '') next.push('');
    next.push('# PostgreSQL (written by packages/db/scripts/setup-local.mjs)');
    for (const k of missing) next.push(`${k}="${values[k]}"`);
  }
  fs.writeFileSync(file, next.join('\n').replace(/\n*$/, '\n'), { mode: 0o600 });
}

/** Same server and credentials, different database name. */
export function withDatabase(url, db) {
  const u = new URL(url);
  u.pathname = `/${db}`;
  return u.toString();
}
