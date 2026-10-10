import type { NextRequest } from 'next/server';
import { rateLimit } from '../../../../lib/form-guard';
import { json, sameOrigin, sendVerificationEmail } from '../../../../lib/auth-server';
import { memberFromRequest } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  if (account.emailVerifiedAt) return json({ ok: true, alreadyVerified: true });
  if (!rateLimit(`verify-mail:${account.id}`, 3, 60 * 60_000)) {
    return json({ error: 'We have sent a few links already. Please check your inbox (and spam folder).' }, 429);
  }
  sendVerificationEmail(account);
  return json({ ok: true });
}
