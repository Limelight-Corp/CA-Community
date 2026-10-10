/**
 * Small, framework-free helpers shared by the public content pages
 * (news, resources, gallery, speakers, contact, search).
 */

/** Parses "YYYY-MM-DD" as a local calendar day, or any other Date-parsable string. */
export function parseLooseDate(value?: string): Date | null {
  if (!value) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : new Date(t);
}

/** Human date ("3 Nov 2026"); falls back to the stored text when it cannot be parsed. */
export function formatDisplayDate(value?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  const d = parseLooseDate(value);
  return d ? d.toLocaleDateString('en-IN', opts) : value || '';
}

/** ISO 8601 date for <time dateTime> and structured data, or undefined. */
export function isoDate(value?: string): string | undefined {
  const d = parseLooseDate(value);
  if (!d) return undefined;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function sortByDateDesc<T extends { date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (parseLooseDate(b.date)?.getTime() ?? 0) - (parseLooseDate(a.date)?.getTime() ?? 0));
}

/** Canonical category list first (in order), then any extra categories present in the data. */
export function mergeCategories(canonical: readonly string[], items: { category?: string }[]): string[] {
  const out = [...canonical];
  const seen = new Set(canonical.map((c) => c.toLowerCase()));
  for (const item of items) {
    const c = item.category?.trim();
    if (c && !seen.has(c.toLowerCase())) {
      seen.add(c.toLowerCase());
      out.push(c);
    }
  }
  return out;
}

export function sameCategory(a?: string, b?: string): boolean {
  return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
}

/** Only allow http(s) links from CMS content into href/src attributes. */
export function safeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Public link for a resource file; the route enforces members-only access. */
export function resourceDownloadUrl(id: string): string {
  return `/api/resources/${encodeURIComponent(id)}/download`;
}

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Deterministic brand-token gradient used where an item has no image.
 * Built only from theme variables so it follows the design tokens.
 */
export function generatedGradient(seed: string): string {
  const h = hash(seed);
  const variants = [
    `radial-gradient(80% 90% at 85% 10%, rgb(var(--lime-rgb) / 0.75), transparent 60%), radial-gradient(70% 80% at 0% 100%, rgb(var(--gold-rgb) / 0.32), transparent 60%), linear-gradient(155deg, var(--brand-800), var(--brand-950))`,
    `radial-gradient(90% 80% at 10% 0%, rgb(var(--gold-rgb) / 0.45), transparent 60%), radial-gradient(80% 80% at 100% 100%, rgb(var(--lime-rgb) / 0.55), transparent 60%), linear-gradient(200deg, var(--brand-900), var(--brand-950))`,
    `radial-gradient(70% 70% at 50% 0%, rgb(var(--sky-rgb) / 0.45), transparent 65%), radial-gradient(60% 70% at 100% 100%, rgb(var(--gold-rgb) / 0.3), transparent 60%), linear-gradient(170deg, var(--brand-700), var(--brand-950))`,
    `conic-gradient(from ${h % 360}deg at 70% 30%, rgb(var(--lime-rgb) / 0.55), rgb(var(--navy-rgb) / 0.9), rgb(var(--gold-rgb) / 0.35), rgb(var(--lime-rgb) / 0.55))`,
  ];
  return variants[h % variants.length]!;
}

/** YouTube / Vimeo → privacy-friendly embed URL; null for anything else. */
export function videoEmbedUrl(url?: string): string | null {
  const safe = safeUrl(url);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const id = u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.match(/(\d{5,})/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Returns an embeddable Google Maps URL when the configured map link is a Google Maps URL;
 * otherwise null (the page then shows a plain link). Never fabricates a location.
 */
export function googleMapsEmbedUrl(mapUrl?: string, address?: string): string | null {
  const safe = safeUrl(mapUrl);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./, '');
    const isGoogle = /^(google\.[a-z.]+|maps\.google\.[a-z.]+)$/.test(host) || host === 'maps.app.goo.gl' || host === 'goo.gl';
    if (!isGoogle) return null;
    if (u.pathname.startsWith('/maps/embed')) return u.toString();
    const q = u.searchParams.get('q') || u.searchParams.get('query') || address;
    if (!q) return null;
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  } catch {
    return null;
  }
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
