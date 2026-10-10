import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { json, sameOrigin, sendPasswordResetEmail } from '../../../../lib/auth-server';
import { findAccountByEmail } from '../../../../lib/member-accounts';
import { CAPTCHA_ERROR, tokenFrom, verifyTurnstile } from '../../../../lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ email: z.string().trim().toLowerCase().email().max(160) });

/** Always answers the same way, so it can't be used to find out which emails have accounts. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  if (!rateLimit(`forgot:${clientIp(req)}`, 10, 60 * 60_000)) {
    return json({ error: 'Too many requests. Please try again later.' }, 429);
  }
  const body = await readJsonBody(req);
  if (!(await verifyTurnstile(tokenFrom(body), clientIp(req)))) return json({ error: CAPTCHA_ERROR }, 400);
  const parsed = Input.safeParse(body);
  if (!parsed.success) return json({ error: 'Enter a valid email address.' }, 422);
  const account = findAccountByEmail(parsed.data.email);
  if (account && rateLimit(`forgot-mail:${account.id}`, 3, 60 * 60_000)) sendPasswordResetEmail(account);
  return json({ ok: true });
}
