/**
 * Shared PostgreSQL access for the web and admin apps (server only).
 *
 * One PrismaClient per process. In development Next.js re-evaluates modules on every change, so
 * the client is cached on globalThis to avoid opening a new connection pool each time.
 */
import { PrismaClient } from '../generated/client';

const globalForPrisma = globalThis as unknown as { __ascendPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__ascendPrisma ??
  new PrismaClient({ log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.__ascendPrisma = prisma;

export * from '../generated/client';

/** True when the error is a unique-constraint violation (Prisma P2002). */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

// PostgreSQL data layer in the apps' shapes.
export * as store from './store';
