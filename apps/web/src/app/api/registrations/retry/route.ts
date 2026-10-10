import { NextResponse } from 'next/server';
import { z } from 'zod';
import { mutatePrivate } from '../../../../lib/community-store';
import { eventStatus, seatsLeft } from '../../../../lib/events';
import {
  clientIp,
  createRazorpayOrder,
  seatsAvailable,
  findEventById,
  findRegistrationWithToken,
  rateLimit,
} from '../_lib/server';
import { memberFromRequest } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RetryInput = z.object({
  bookingId: z.string().trim().min(1).max(60),
  accessToken: z.string().trim().min(1).max(200),
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Issues a fresh payment order for an existing pending / failed registration. */
export async function POST(req: Request) {
  if (!rateLimit(`retry:${clientIp(req)}`, 15, 10 * 60_000)) {
    return json({ error: 'Too many attempts. Please wait a few minutes.' }, 429);
  }
  if (!memberFromRequest(req)) {
    return json({ error: 'Please log in to pay for this registration.', loginRequired: true }, 401);
  }
  const parsed = RetryInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);

  const reg = findRegistrationWithToken(parsed.data.bookingId, parsed.data.accessToken);
  if (!reg) return json({ error: 'Registration not found.' }, 404);

  const base = { bookingId: reg.bookingId, status: reg.status, paymentStatus: reg.paymentStatus, fee: reg.fee };
  if (reg.paymentStatus === 'paid' || reg.status !== 'pending_payment' || reg.fee <= 0) {
    return json({ ...base, error: 'This registration does not need a payment.' }, 409);
  }

  const event = findEventById(reg.eventId);
  const status = event ? eventStatus(event) : 'closed';
  if (!event || status === 'past' || status === 'closed' || status === 'cancelled' || seatsLeft(event) <= 0) {
    return json({ ...base, error: 'Payments for this event are closed. Please contact us for help.' }, 409);
  }

  // Claim (or renew) this booking's seat hold atomically before opening a payment, so two people
  // cannot both start paying for the last seat.
  const claimed = mutatePrivate((data) => {
    const r = data.registrations.find((x) => x.bookingId === reg.bookingId);
    if (!r || r.paymentStatus === 'paid') return false;
    if (seatsAvailable(event, data.registrations, reg.bookingId) <= 0) return false;
    r.updatedAt = new Date().toISOString();
    return true;
  });
  if (!claimed) {
    return json(
      { ...base, error: 'All remaining seats are taken or held by people completing their payment. Please try again in about 30 minutes.' },
      409
    );
  }

  const payment = await createRazorpayOrder(reg);
  if (payment.provider === 'razorpay') {
    const orderId = payment.orderId;
    mutatePrivate((data) => {
      const r = data.registrations.find((x) => x.bookingId === reg.bookingId);
      if (r && r.paymentStatus !== 'paid') {
        r.gatewayOrderId = orderId;
        r.paymentStatus = 'pending';
        r.updatedAt = new Date().toISOString();
      }
    });
  }
  return json({ ...base, payment });
}
