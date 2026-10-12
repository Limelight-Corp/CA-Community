#!/usr/bin/env node
/**
 * Copies Prisma's query engine (and schema) from packages/db/generated/client into
 * <app>/.prisma/client before `next build`.
 *
 * Next.js bundles @ascend/db, and on Vercel the generated client folder is not where Prisma looks
 * at runtime. `<cwd>/.prisma/client` is one of the places it always searches, and next.config
 * traces that folder into every server function, so the engine ships with the deployment.
 *
 *   node ../../packages/db/scripts/copy-engine.mjs <appDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const from = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../generated/client');
const appDir = path.resolve(process.argv[2] || process.cwd());
const to = path.join(appDir, '.prisma', 'client');

if (!fs.existsSync(from)) {
  console.error(`copy-engine: ${from} not found — run the @ascend/db build (prisma generate) first`);
  process.exit(1);
}
fs.mkdirSync(to, { recursive: true });
const files = fs.readdirSync(from).filter((f) => f.endsWith('.node') || f === 'schema.prisma');
for (const f of files) fs.copyFileSync(path.join(from, f), path.join(to, f));
console.log(`copy-engine: ${files.length} file(s) → ${path.relative(process.cwd(), to) || to}`);
