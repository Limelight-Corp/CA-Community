/**
 * Member sign-in helpers shared by server routes, server pages and client components.
 *
 * AuthContext stores the member token in localStorage and in the `ascend_member_token`
 * cookie (SameSite=Lax). Member login is still a prototype — the Express API is not wired to
 * the website yet — so the server can only check that a member session cookie is present; it
 * cannot verify the token. Once the API is live, verify the token here.
 */

export const MEMBER_COOKIE = 'ascend_member_token';

/** True when a member session cookie value is present. */
export function hasMemberSession(token: string | undefined | null): boolean {
  return typeof token === 'string' && token.trim().length > 0;
}

/** Reads the member session cookie from a request's Cookie header. */
export function memberTokenFromRequest(req: Request): string | undefined {
  const header = req.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === MEMBER_COOKIE) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null;
  if (next.startsWith('/login') || next.startsWith('/api/')) return null;
  return next;
}

/** `/login?next=<path>` for sending a visitor to sign in and back. */
export function loginUrl(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
