import type { NextRequest } from 'next/server';
import { rateLimit } from '../../../../lib/form-guard';
import { json, sameOrigin } from '../../../../lib/auth-server';
import { createMembershipOrder } from '../../../../lib/membership';
import { memberFromRequest } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Starts a Razorpay order for the signed-in member's approved membership (first payment or renewal). */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in to pay for your membership.' }, 401);
  if (!account.emailVerifiedAt) return json({ error: 'Please confirm your email first.' }, 403);
  if (!rateLimit(`mem-order:${account.id}`, 15, 10 * 60_000)) return json({ error: 'Too many attempts. Please wait a few minutes.' }, 429);
  const result = await createMembershipOrder(account);
  if (!result.ok) return json({ error: result.error }, result.status);
  const { ok: _ok, ...payment } = result;
  return json({ payment: { provider: 'razorpay', ...payment }, prefill: { name: account.name, email: account.email, contact: account.mobile } });
}
