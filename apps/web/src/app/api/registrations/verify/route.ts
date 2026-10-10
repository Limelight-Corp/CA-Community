import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { CommunityRegistration } from '@ascend/shared';
import { mutatePrivate } from '../../../../lib/community-store';
import { notifyPaymentConfirmed, notifyPaymentFailed } from '../../../../lib/notifications';
import { clientIp, rateLimit, safeEqual, takeSeat, verifyRazorpaySignature } from '../_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VerifyInput = z.object({
  bookingId: z.string().trim().min(1).max(60),
  accessToken: z.string().trim().min(1).max(200),
  /** Set by the client when Razorpay reports a failed attempt (no signature to check). */
  failed: z.boolean().optional(),
  razorpay_order_id: z.string().trim().max(100).optional(),
  razorpay_payment_id: z.string().trim().max(100).optional(),
  razorpay_signature: z.string().trim().max(200).optional(),
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!rateLimit(`verify:${clientIp(req)}`, 30, 10 * 60_000)) {
    return json({ error: 'Too many attempts. Please wait a few minutes.' }, 429);
  }
  const parsed = VerifyInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);
  const input = parsed.data;

  const signatureOk =
    !input.failed &&
    verifyRazorpaySignature(input.razorpay_order_id || '', input.razorpay_payment_id || '', input.razorpay_signature || '');

  type Result =
    | { kind: 'notfound' }
    | { kind: 'paid'; eventId: string; firstTime: boolean; status: string; paymentStatus: string; reg: CommunityRegistration }
    | { kind: 'failed'; status: string; paymentStatus: string; reg: CommunityRegistration; newlyFailed: boolean };

  const result = mutatePrivate<Result>((data) => {
    const reg = data.registrations.find((r) => r.bookingId === input.bookingId);
    if (!reg || !safeEqual(reg.accessToken, input.accessToken)) return { kind: 'notfound' };

    // Idempotent: an already-paid registration stays paid and never takes a second seat.
    if (reg.paymentStatus === 'paid') {
      return { kind: 'paid', eventId: reg.eventId, firstTime: false, status: reg.status, paymentStatus: reg.paymentStatus, reg: { ...reg } };
    }

    const orderMatches = !!reg.gatewayOrderId && safeEqual(reg.gatewayOrderId, input.razorpay_order_id || '');
    const stamp = new Date().toISOString();
    if (signatureOk && orderMatches) {
      reg.status = 'confirmed';
      reg.paymentStatus = 'paid';
      reg.gatewayPaymentId = input.razorpay_payment_id;
      reg.paidAt = stamp;
      reg.updatedAt = stamp;
      return { kind: 'paid', eventId: reg.eventId, firstTime: true, status: reg.status, paymentStatus: reg.paymentStatus, reg: { ...reg } };
    }

    // Keep the registration; the registrant can retry with a fresh order.
    let newlyFailed = false;
    if (reg.status === 'pending_payment') {
      newlyFailed = reg.paymentStatus !== 'failed';
      reg.paymentStatus = 'failed';
      reg.updatedAt = stamp;
    }
    return { kind: 'failed', status: reg.status, paymentStatus: reg.paymentStatus, reg: { ...reg }, newlyFailed };
  });

  if (result.kind === 'notfound') return json({ error: 'Registration not found.' }, 404);
  if (result.kind === 'paid') {
    if (result.firstTime) {
      takeSeat(result.eventId);
      notifyPaymentConfirmed(result.reg);
    }
    return json({ ok: true, status: result.status, paymentStatus: result.paymentStatus });
  }
  // One "payment failed" email per attempt (a retry resets the status to pending).
  if (result.newlyFailed) notifyPaymentFailed(result.reg);
  return json(
    {
      ok: false,
      status: result.status,
      paymentStatus: result.paymentStatus,
      error: input.failed
        ? 'The payment did not go through. Your registration is saved — you can retry.'
        : 'We could not verify this payment. Your registration is saved — please retry or contact us.',
    },
    input.failed ? 200 : 400
  );
}
