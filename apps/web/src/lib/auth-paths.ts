/** Login redirect helpers — safe to use in client and server code. */
import { sameSitePath } from '@ascend/shared';

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNextPath(next: string | null | undefined): string | null {
  const path = sameSitePath(next);
  if (!path || path.startsWith('/login') || path.startsWith('/api/')) return null;
  return path;
}

/** `/login?next=<path>` for sending a visitor to sign in and back. */
export function loginUrl(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
