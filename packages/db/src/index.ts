/**
 * Shared PostgreSQL access for the web and admin apps (server only).
 *
 * One PrismaClient per process. In development Next.js re-evaluates modules on every change, so
 * the client is cached on globalThis to avoid opening a new connection pool each time.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '../generated/client';

/**
 * Vercel deploys each route and the middleware as separate functions with their own file layout,
 * and Prisma does not search every place the build puts its query engine (the middleware gets it
 * in .next/server). Point Prisma at the engine explicitly when it is found.
 */
const VERCEL_ENGINE = 'libquery_engine-rhel-openssl-3.0.x.so.node';
if (process.env.VERCEL && !process.env.PRISMA_QUERY_ENGINE_LIBRARY) {
  const dirs = ['.next/server', '.next/server/chunks', '.next', '.prisma/client', 'generated/client', 'node_modules/.prisma/client', '../../packages/db/generated/client'];
  const found = dirs.map((d) => path.join(process.cwd(), d, VERCEL_ENGINE)).find((f) => fs.existsSync(f));
  if (found) process.env.PRISMA_QUERY_ENGINE_LIBRARY = found;
}

/**
 * On serverless hosts DATABASE_URL has connection_limit=1, so parallel queries wait for that one
 * connection. Prisma gives up after pool_timeout (10 s by default); allow longer unless it is set.
 */
function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || /[?&]pool_timeout=/.test(url)) return url;
  return `${url}${url.includes('?') ? '&' : '?'}pool_timeout=30`;
}

const globalForPrisma = globalThis as unknown as { __ascendPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__ascendPrisma ??
  new PrismaClient({ datasourceUrl: databaseUrl(), log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ascendPrisma = prisma;

export * from '../generated/client';

/** True when the error is a unique-constraint violation (Prisma P2002). */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

// PostgreSQL data layer in the apps' shapes.
export * as store from './store';
