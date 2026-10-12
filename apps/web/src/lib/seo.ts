/** Public origin used for canonical URLs, sitemap and structured data. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return url.replace(/\/+$/, '');
}

/**
 * Serialises JSON-LD safely for a <script type="application/ld+json"> tag: <, > and & become
 * JSON unicode escapes (so admin text cannot close the tag), as do U+2028/U+2029.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
