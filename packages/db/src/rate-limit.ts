/**
 * Rate limits and failed-login locks shared by every server instance.
 *
 * On Vercel each request may run in a different function instance, so in-memory counters barely
 * limit anything. These helpers count in PostgreSQL (rate_limit_buckets, one atomic upsert per
 * hit). If the database cannot be reached they fall back to a per-instance counter, so a database
 * hiccup never locks everyone out.
 */
import { rateLimitClear, rateLimitHit, rateLimitPeek } from './store';

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

function memoryHit(key: string, windowMs: number): number {
  const now = Date.now();
  if (memory.size > 5000) for (const [k, b] of memory) if (b.resetAt <= now) memory.delete(k);
  const b = memory.get(key);
  if (!b || b.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }
  b.count += 1;
  return b.count;
}

function memoryPeek(key: string): { count: number; resetsInMs: number } {
  const b = memory.get(key);
  const left = b ? b.resetAt - Date.now() : 0;
  return b && left > 0 ? { count: b.count, resetsInMs: left } : { count: 0, resetsInMs: 0 };
}

function warn(err: unknown): void {
  console.error('[rate-limit] database unavailable, using the in-memory counter:', (err as Error)?.message);
}

/** Counts one hit; true while `key` is within `limit` hits per `windowMs`. */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    return (await rateLimitHit(key, windowMs)) <= limit;
  } catch (err) {
    warn(err);
    return memoryHit(key, windowMs) <= limit;
  }
}

/**
 * Failed-attempt lock: after `limit` failures within `windowMs` the key is locked until that
 * window ends. Same idea as FailureThrottle in @ascend/shared, but shared across instances.
 */
export class SharedFailureThrottle {
  constructor(
    private readonly scope: string,
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  private key(id: string): string {
    return `${this.scope}:${id}`;
  }

  /** Minutes until `id` may try again (0 = not locked). */
  async lockedFor(id: string): Promise<number> {
    let peek: { count: number; resetsInMs: number };
    try {
      peek = await rateLimitPeek(this.key(id));
    } catch (err) {
      warn(err);
      peek = memoryPeek(this.key(id));
    }
    return peek.count >= this.limit ? Math.max(1, Math.ceil(peek.resetsInMs / 60_000)) : 0;
  }

  /** Records a failure; returns how many attempts are left before the lock. */
  async fail(id: string): Promise<number> {
    let count: number;
    try {
      count = await rateLimitHit(this.key(id), this.windowMs);
    } catch (err) {
      warn(err);
      count = memoryHit(this.key(id), this.windowMs);
    }
    return Math.max(0, this.limit - count);
  }

  async clear(id: string): Promise<void> {
    memory.delete(this.key(id));
    await rateLimitClear(this.key(id)).catch(warn);
  }
}
