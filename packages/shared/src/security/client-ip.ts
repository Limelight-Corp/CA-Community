/**
 * Client IP and failure throttling shared by the web and admin apps (server only).
 *
 * The apps run behind nginx, which appends the real peer address as the LAST entry of
 * X-Forwarded-For (`$proxy_add_x_forwarded_for`). Anything to the left of it was sent by the
 * client and can be forged, so it is never used for rate limiting.
 */

type HeaderSource = { get(name: string): string | null };

/**
 * Number of trusted proxies in front of the app (default 1 = nginx). Set TRUSTED_PROXY_HOPS=0
 * when the app is reached directly: then no forwarding header is trusted at all.
 */
function trustedHops(): number {
  const raw = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
  return Number.isInteger(raw) && raw >= 0 ? raw : 1;
}

export function clientIpFromHeaders(headers: HeaderSource): string {
  const hops = trustedHops();
  if (hops === 0) return 'direct';
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // The entry added by the outermost trusted proxy (nginx overwrites X-Real-IP the same way).
  if (chain.length >= hops) return chain[chain.length - hops]!;
  return headers.get('x-real-ip')?.trim() || 'direct';
}

/**
 * In-memory failure counter with a fixed window. Per process (resets on restart) — fine for one
 * server; use a shared store such as Redis when running several instances.
 */
export class FailureThrottle {
  private hits = new Map<string, { count: number; first: number }>();

  constructor(
    private readonly max: number,
    private readonly windowMs: number
  ) {}

  /** Minutes until `key` may try again (0 when not locked). */
  lockedFor(key: string, now = Date.now()): number {
    const e = this.hits.get(key);
    if (!e) return 0;
    const elapsed = now - e.first;
    if (elapsed > this.windowMs) {
      this.hits.delete(key);
      return 0;
    }
    return e.count >= this.max ? Math.max(1, Math.ceil((this.windowMs - elapsed) / 60_000)) : 0;
  }

  /** Records a failure and returns how many attempts are left in the window. */
  fail(key: string, now = Date.now()): number {
    this.prune(now);
    const e = this.hits.get(key);
    if (!e || now - e.first > this.windowMs) this.hits.set(key, { count: 1, first: now });
    else e.count += 1;
    return Math.max(0, this.max - (this.hits.get(key)?.count ?? 0));
  }

  clear(key: string): void {
    this.hits.delete(key);
  }

  /** Drops expired entries so the map cannot grow without bound. */
  private prune(now: number): void {
    if (this.hits.size < 1000) return;
    for (const [k, e] of this.hits) if (now - e.first > this.windowMs) this.hits.delete(k);
  }
}
