/** Login redirect helpers — safe to use in client and server code. */

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
