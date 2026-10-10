import crypto from 'crypto';
import { NextResponse } from 'next/server';
import type { CommunityRegistration } from '@ascend/shared';
import { mutatePrivate } from '../../../../../lib/community-store';
import { notifyPaymentConfirmed, notifyPaymentFailed } from '../../../../../lib/notifications';
import { completeMembershipPayment } from '../../../../../lib/membership';
import { safeEqual, takeSeat } from '../../../registrations/_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Razorpay webhook — confirms bookings even when the attendee closes the browser before the
 * client-side verify call runs.
 *
 * Setup (Razorpay Dashboard → Settings → Webhooks): URL = <site>/api/payments/razorpay/webhook,
 * events = payment.captured, payment.failed, order.paid; the secret goes in
 * RAZORPAY_WEBHOOK_SECRET. Every request is authenticated with X-Razorpay-Signature =
 * HMAC-SHA256(raw body, webhook secret). Handling is idempotent: Razorpay retries deliveries,
 * and a booking that is already paid is never confirmed (or emailed) twice.
 */

interface PaymentEntity {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
}

function ok(body: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...body });
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  if (!safeEqual(expected, signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

  let body: { event?: string; payload?: { payment?: { entity?: PaymentEntity } } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event || '';
  const payment = body.payload?.payment?.entity;
  if (!payment?.order_id || !['payment.captured', 'order.paid', 'payment.failed'].includes(event)) {
    // Acknowledge events we don't act on so Razorpay stops retrying them.
    return ok({ ignored: true });
  }

  type Outcome =
    | { kind: 'unknown' }
    | { kind: 'mismatch' }
    | { kind: 'noop' }
    | { kind: 'paid'; reg: CommunityRegistration }
    | { kind: 'failed'; reg: CommunityRegistration };

  const outcome = mutatePrivate<Outcome>((data) => {
    const reg = data.registrations.find((r) => !!r.gatewayOrderId && r.gatewayOrderId === payment.order_id);
    if (!reg) return { kind: 'unknown' };
    const stamp = new Date().toISOString();

    if (event === 'payment.failed') {
      // Only an open attempt can fail; never downgrade a paid or cancelled booking.
      if (reg.status !== 'pending_payment' || reg.paymentStatus !== 'pending') return { kind: 'noop' };
      reg.paymentStatus = 'failed';
      reg.updatedAt = stamp;
      return { kind: 'failed', reg: { ...reg } };
    }

    if (reg.paymentStatus === 'paid' || reg.paymentStatus === 'refunded') return { kind: 'noop' };
    // The captured amount must match the server-computed fee for this booking.
    if (payment.amount !== Math.round(reg.fee * 100) || (payment.currency && payment.currency !== 'INR')) {
      return { kind: 'mismatch' };
    }
    const wasConfirmed = reg.status === 'confirmed';
    reg.status = 'confirmed';
    reg.paymentStatus = 'paid';
    reg.gatewayPaymentId = payment.id || reg.gatewayPaymentId;
    reg.paidAt = stamp;
    reg.updatedAt = stamp;
    return wasConfirmed ? { kind: 'noop' } : { kind: 'paid', reg: { ...reg } };
  });

  switch (outcome.kind) {
    case 'unknown': {
      // Not an event booking — it may be a membership payment.
      if (event !== 'payment.failed' && payment.id) {
        const m = completeMembershipPayment(payment.order_id, payment.id, payment.amount);
        if (m === 'mismatch') {
          console.error(`[razorpay webhook] ${event}: membership amount mismatch for order ${payment.order_id} (${payment.amount})`);
          return ok({ ignored: true });
        }
        if (m) return ok(m.duplicate ? { duplicate: true } : { membership: m.payment.id });
      }
      if (event !== 'payment.failed') console.warn(`[razorpay webhook] ${event}: no booking or membership for order ${payment.order_id}`);
      return ok({ ignored: true });
    }
    case 'mismatch':
      console.error(`[razorpay webhook] ${event}: amount mismatch for order ${payment.order_id} (${payment.amount})`);
      return ok({ ignored: true });
    case 'paid':
      takeSeat(outcome.reg.eventId);
      notifyPaymentConfirmed(outcome.reg);
      return ok({ confirmed: outcome.reg.bookingId });
    case 'failed':
      notifyPaymentFailed(outcome.reg);
      return ok({ failed: outcome.reg.bookingId });
    default:
      return ok({ duplicate: true });
  }
}
