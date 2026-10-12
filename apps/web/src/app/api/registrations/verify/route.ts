import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { CommunityRegistration } from '@ascend/shared';
import { store } from '../../../../lib/community-store';
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
  if (!(await rateLimit(`verify:${clientIp(req)}`, 30, 10 * 60_000))) {
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
    | { kind: 'cancelled' }
    | { kind: 'paid'; eventId: string; firstTime: boolean; status: string; paymentStatus: string; reg: CommunityRegistration }
    | { kind: 'failed'; status: string; paymentStatus: string; reg: CommunityRegistration; newlyFailed: boolean };

  // One transaction with the booking row locked, so this and the Razorpay webhook can never both
  // confirm the same payment (and take two seats).
  const result = await store.prisma.$transaction(async (tx): Promise<Result> => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM event_registrations WHERE booking_id = ${input.bookingId} FOR UPDATE`;
    if (!locked.length) return { kind: 'notfound' };
    const reg = await store.getRegistration({ bookingId: input.bookingId }, tx);
    // Token checked by hash (constant-time compare of the stored token's digest).
    const byToken = await store.getRegistration({ accessToken: input.accessToken }, tx);
    if (!reg || !byToken || byToken.id !== reg.id) return { kind: 'notfound' };

    // Idempotent: an already-paid registration stays paid and never takes a second seat.
    if (reg.paymentStatus === 'paid' && reg.status === 'cancelled') return { kind: 'cancelled' };
    if (reg.paymentStatus === 'paid') {
      return { kind: 'paid', eventId: reg.eventId, firstTime: false, status: reg.status, paymentStatus: reg.paymentStatus, reg: { ...reg } };
    }

    const orderMatches = !!reg.gatewayOrderId && safeEqual(reg.gatewayOrderId, input.razorpay_order_id || '');
    const stamp = new Date().toISOString();
    // Paid for a booking the admin had cancelled: record the payment (for a refund), keep it cancelled.
    if (signatureOk && orderMatches && reg.status === 'cancelled') {
      await store.updateRegistration({ id: reg.id }, { paymentStatus: 'paid', gatewayPaymentId: input.razorpay_payment_id, paidAt: stamp }, tx);
      return { kind: 'cancelled' };
    }
    if (signatureOk && orderMatches) {
      const paid = (await store.updateRegistration(
        { id: reg.id },
        { status: 'confirmed', paymentStatus: 'paid', gatewayPaymentId: input.razorpay_payment_id, paidAt: stamp },
        tx
      ))!;
      // The seat is taken in the same transaction as the payment is recorded.
      await takeSeat(reg.eventId, tx);
      return { kind: 'paid', eventId: reg.eventId, firstTime: true, status: paid.status, paymentStatus: paid.paymentStatus, reg: paid };
    }

    // Keep the registration; the registrant can retry with a fresh order.
    let newlyFailed = false;
    let current = reg;
    if (reg.status === 'pending_payment') {
      newlyFailed = reg.paymentStatus !== 'failed';
      current = (await store.updateRegistration({ id: reg.id }, { paymentStatus: 'failed' }, tx)) ?? reg;
    }
    return { kind: 'failed', status: current.status, paymentStatus: current.paymentStatus, reg: current, newlyFailed };
  });

  if (result.kind === 'notfound') return json({ error: 'Registration not found.' }, 404);
  if (result.kind === 'cancelled') {
    console.error(`[verify] payment ${input.razorpay_payment_id} received for cancelled booking ${input.bookingId} — refund it from the admin Payments page`);
    return json({ ok: false, error: 'This booking was cancelled, so the payment was not used for it. We have recorded the payment — please contact us about the refund.' }, 409);
  }
  if (result.kind === 'paid') {
    if (result.firstTime) await notifyPaymentConfirmed(result.reg);
    return json({ ok: true, status: result.status, paymentStatus: result.paymentStatus });
  }
  // One "payment failed" email per attempt (a retry resets the status to pending).
  if (result.newlyFailed) await notifyPaymentFailed(result.reg);
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
