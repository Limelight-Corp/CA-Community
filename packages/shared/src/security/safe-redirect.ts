/**
 * Post-login destinations: only paths on this same site.
 *
 * Browsers drop tabs and newlines and treat a backslash like "/" when they resolve a URL, so a
 * value such as "/<TAB>/evil.com" turns into "//evil.com" (another site). Control characters and
 * backslashes are therefore rejected outright, and the path is then resolved and must stay on
 * this site. Returns the normalised path, or null when it is not a safe same-site path.
 */
const BASE = 'https://same-site.invalid';

export function sameSitePath(next: string | null | undefined): string | null {
  if (!next || next.length > 2000 || !next.startsWith('/')) return null;
  for (let i = 0; i < next.length; i++) {
    const code = next.charCodeAt(i);
    // 0-31 and 127: control characters; 92: backslash.
    if (code < 32 || code === 127 || code === 92) return null;
  }
  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
