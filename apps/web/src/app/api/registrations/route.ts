import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { CommunityRegistration } from '@ascend/shared';
import { mutatePrivate, newId, newSecret } from '../../../lib/community-store';
import { canRegister, seatsLeft } from '../../../lib/events';
import {
  clientIp,
  createRazorpayOrder,
  findPublishedEvent,
  generateBookingId,
  rateLimit,
  takeSeat,
  type PaymentInit,
} from './_lib/server';
import { hasMemberSession, memberTokenFromRequest } from '../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** Accepts +91 / 0 prefixes and separators; stores the 10-digit Indian mobile number. */
const mobileSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, ''))
  .refine((v) => /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number');

const RegistrationInput = z.object({
  eventSlug: z.string().trim().min(1).max(120),
  name: z.string().trim().min(2, 'Enter your full name').max(100),
  membershipNo: optionalText(40),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(160),
  mobile: mobileSchema,
  city: z.string().trim().min(2, 'Enter your city').max(80),
  organisation: optionalText(120),
  designation: optionalText(120),
  requirements: optionalText(1000),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Please accept the event terms' }) }),
  /** Honeypot: real users never see or fill this. */
  website: z.string().optional(),
});

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  if (!rateLimit(`reg:${clientIp(req)}`, 10, 10 * 60_000)) {
    return json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  const parsed = RegistrationInput.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return json({ error: 'Please check the highlighted fields.', fieldErrors }, 422);
  }
  const input = parsed.data;

  // Honeypot filled → pretend nothing happened, store nothing.
  if (input.website && input.website.trim() !== '') {
    return json({ error: 'Registration could not be completed.' }, 400);
  }

  const event = findPublishedEvent(input.eventSlug);
  if (!event) return json({ error: 'This event could not be found.' }, 404);

  // Paid events: only signed-in members can register and pay.
  if (Math.max(0, Number(event.fee) || 0) > 0 && !hasMemberSession(memberTokenFromRequest(req))) {
    return json({ error: 'Please log in to register and pay for this event.', loginRequired: true }, 401);
  }

  type Outcome =
    | { kind: 'existing'; reg: CommunityRegistration }
    | { kind: 'conflict' }
    | { kind: 'closed'; message: string }
    | { kind: 'created'; reg: CommunityRegistration };

  const outcome = mutatePrivate<Outcome>((data) => {
    const existing = data.registrations.find(
      (r) =>
        r.eventId === event.id &&
        r.email.toLowerCase() === input.email &&
        (r.status === 'confirmed' || r.status === 'pending_payment')
    );
    if (existing) {
      // Only hand back the existing booking to someone who also knows the registered mobile.
      return existing.mobile === input.mobile ? { kind: 'existing', reg: existing } : { kind: 'conflict' };
    }

    if (!canRegister(event) || seatsLeft(event) <= 0) {
      return { kind: 'closed', message: 'Registrations for this event are closed.' };
    }

    const stamp = new Date().toISOString();
    const fee = Math.max(0, Number(event.fee) || 0);
    const reg: CommunityRegistration = {
      id: newId('reg'),
      bookingId: generateBookingId(event, data.registrations),
      accessToken: newSecret(),
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: event.title,
      name: input.name,
      membershipNo: input.membershipNo,
      email: input.email,
      mobile: input.mobile,
      city: input.city,
      organisation: input.organisation,
      designation: input.designation,
      requirements: input.requirements,
      fee,
      status: fee > 0 ? 'pending_payment' : 'confirmed',
      paymentStatus: fee > 0 ? 'pending' : 'not_required',
      createdAt: stamp,
      updatedAt: stamp,
    };
    data.registrations.push(reg);
    return { kind: 'created', reg };
  });

  if (outcome.kind === 'conflict') {
    return json(
      {
        error:
          'This email is already registered for this event. Open the confirmation link from your registration, or contact us if you need help.',
        fieldErrors: { email: 'Already registered for this event' },
      },
      409
    );
  }
  if (outcome.kind === 'closed') return json({ error: outcome.message }, 409);

  const reg = outcome.reg;
  // Free registrations take their seat immediately (synchronously after the private write).
  if (outcome.kind === 'created' && reg.status === 'confirmed') takeSeat(event.id);

  let payment: PaymentInit | undefined;
  if (reg.status === 'pending_payment' && reg.fee > 0) {
    payment = await createRazorpayOrder(reg);
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
  }

  return json(
    {
      bookingId: reg.bookingId,
      accessToken: reg.accessToken,
      status: reg.status,
      paymentStatus: reg.paymentStatus,
      fee: reg.fee,
      duplicate: outcome.kind === 'existing' || undefined,
      payment,
    },
    outcome.kind === 'created' ? 201 : 200
  );
}
