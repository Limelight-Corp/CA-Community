/**
 * Cloudflare Turnstile CAPTCHA (checklist §23), server side.
 * Active only when both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY are set; until then the
 * public forms rely on the honeypot field and rate limits alone.
 */

export function turnstileEnabled(): boolean {
  return !!(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

/** True when the CAPTCHA is disabled or the token is valid. */
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, cache: 'no-store' });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verification failed:', err);
    return false;
  }
}

export const CAPTCHA_ERROR = 'Please complete the security check and try again.';

/** Reads `turnstileToken` from a parsed JSON body without disturbing the form schema. */
export function tokenFrom(body: unknown): unknown {
  return body && typeof body === 'object' ? (body as Record<string, unknown>).turnstileToken : undefined;
}
