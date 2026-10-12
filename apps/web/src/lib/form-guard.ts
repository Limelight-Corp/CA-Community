/**
 * Server-side guards for public form endpoints (membership, contact).
 * Rate limits are counted in PostgreSQL, so they hold across every server instance.
 */
import type { NextRequest } from 'next/server';
import { clientIpFromHeaders } from '@ascend/shared';

/** Counted in PostgreSQL, shared by every server instance (see @ascend/db rate-limit.ts). Await it. */
export { rateLimit } from '@ascend/db';

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
