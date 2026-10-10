import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { readJsonBody } from '../../../../lib/form-guard';
import { json, sameOrigin } from '../../../../lib/auth-server';
import { completeMembershipPayment } from '../../../../lib/membership';
import { membershipFor } from '../../../../lib/member-accounts';
import { memberFromRequest } from '../../../../lib/member-session';
import { verifyRazorpaySignature } from '../../registrations/_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  failed: z.boolean().optional(),
  razorpay_order_id: z.string().trim().max(100).optional(),
  razorpay_payment_id: z.string().trim().max(100).optional(),
  razorpay_signature: z.string().trim().max(200).optional(),
});

/** Verifies Razorpay's signature and activates / renews the membership. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  const parsed = Input.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);
  const p = parsed.data;
  if (p.failed) return json({ ok: false, error: 'The payment did not go through. You can try again.' });

  const orderId = p.razorpay_order_id || '';
  const paymentId = p.razorpay_payment_id || '';
  if (!verifyRazorpaySignature(orderId, paymentId, p.razorpay_signature || '')) {
    return json({ ok: false, error: 'We could not verify this payment. If money was debited, contact us with your payment ID.' }, 400);
  }
  // The order must belong to this member's own application.
  const app = membershipFor(account);
  if (!app || (app.gatewayOrderId !== orderId && !app.payments?.some((x) => x.gatewayOrderId === orderId))) {
    return json({ ok: false, error: 'This payment does not belong to your membership.' }, 403);
  }
  const done = completeMembershipPayment(orderId, paymentId);
  if (!done || done === 'mismatch') return json({ ok: false, error: 'Payment could not be matched to your membership.' }, 409);
  return json({ ok: true, validUntil: done.app.validUntil, receiptId: done.payment.id });
}
