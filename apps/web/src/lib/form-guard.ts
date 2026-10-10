/**
 * Server-side guards for public form endpoints (membership, contact).
 * In-memory, per-process only — good enough for the interim single-instance deployment.
 */
import type { NextRequest } from 'next/server';
import { clientIpFromHeaders } from '@ascend/shared';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Returns true when the key is still within `limit` hits per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** The caller's IP as seen by our proxy — never the client-supplied part of X-Forwarded-For. */
export function clientIp(request: NextRequest): string {
  return clientIpFromHeaders(request.headers);
}

/** Reads a JSON body, refusing anything over `maxBytes`. Returns null when invalid. */
export async function readJsonBody(request: NextRequest, maxBytes = 16_000): Promise<unknown | null> {
  try {
    const text = await request.text();
    if (text.length > maxBytes) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export { HONEYPOT_FIELD } from './form-schemas';
