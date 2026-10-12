/**
 * Server-only helpers for event registrations and Razorpay payments.
 * Lives in a private (`_lib`) folder so it is never routed.
 */
import crypto from 'crypto';
import { clientIpFromHeaders, type CommunityEvent, type CommunityRegistration } from '@ascend/shared';
import { store } from '../../../../lib/community-store';

type Db = Parameters<typeof store.listRegistrations>[1];

export type PaymentInit =
  | { provider: 'razorpay'; keyId: string; orderId: string; amount: number; currency: 'INR' }
  | { provider: 'unconfigured' }
  | { provider: 'error'; message: string };

/** Fields of a registration that may be returned to the registrant (never the token). */
export function publicRegistration(r: CommunityRegistration) {
  return {
    bookingId: r.bookingId,
    eventSlug: r.eventSlug,
    eventTitle: r.eventTitle,
    name: r.name,
    membershipNo: r.membershipNo,
    email: r.email,
    mobile: r.mobile,
    city: r.city,
    organisation: r.organisation,
    designation: r.designation,
    requirements: r.requirements,
    fee: r.fee,
    status: r.status,
    paymentStatus: r.paymentStatus,
    gatewayPaymentId: r.gatewayPaymentId,
    paidAt: r.paidAt,
    createdAt: r.createdAt,
  };
}

/** Constant-time string comparison (false on any length mismatch). */
export function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function findPublishedEvent(slug: string): Promise<CommunityEvent | undefined> {
  const e = await store.getEvent({ slug });
  return e?.isPublished ? e : undefined;
}

export async function findEventById(id: string, db?: Db): Promise<CommunityEvent | undefined> {
  return store.getEvent({ id }, db);
}

/**
 * Seat holds. A paid booking only takes its seat (`seatsTaken`) once the payment succeeds, so an
 * unpaid booking that is actively paying holds a seat for this long. Without holds, several
 * people could pay for the last seat at the same time and all be confirmed.
 */
export const SEAT_HOLD_MS = 30 * 60 * 1000;

export function holdsSeat(r: CommunityRegistration, now = Date.now()): boolean {
  return r.status === 'pending_payment' && r.paymentStatus !== 'paid' && now - Date.parse(r.updatedAt || r.createdAt) < SEAT_HOLD_MS;
}

/** Unpaid bookings currently holding a seat on the event (optionally ignoring one booking). */
export async function activeHolds(eventId: string, exceptBookingId?: string, db: Db = store.prisma): Promise<number> {
  return db!.eventRegistration.count({
    where: {
      eventId,
      status: 'PENDING_PAYMENT',
      paymentStatus: { not: 'PAID' },
      updatedAt: { gt: new Date(Date.now() - SEAT_HOLD_MS) },
      ...(exceptBookingId ? { bookingId: { not: exceptBookingId } } : {}),
    },
  });
}

/** Seats that can still be booked: free seats minus active holds. Call inside withEventLock for a firm answer. */
export async function seatsAvailable(event: CommunityEvent, exceptBookingId?: string, db?: Db): Promise<number> {
  const held = await activeHolds(event.id, exceptBookingId, db);
  return Math.max(0, (event.seatsTotal || 0) - (event.seatsTaken || 0) - held);
}

/** Counts one more seat on the event (atomic increment — no read-modify-write race). */
export async function takeSeat(eventId: string, db?: Db): Promise<void> {
  const event = await store.addSeatTaken(eventId, 1, db);
  // Only possible when a payment lands after its 30-minute hold lapsed and the seat was resold:
  // the attendee has paid, so they are confirmed, and the team is told to review capacity.
  if (event && event.seatsTotal > 0 && event.seatsTaken > event.seatsTotal) {
    console.warn(`[seats] ${event.slug}: ${event.seatsTaken}/${event.seatsTotal} after a late payment — review capacity`);
  }
}

/** Looks up a registration by its access token (hash lookup) and checks the booking id matches. */
export async function findRegistrationWithToken(bookingId: string, token: string): Promise<CommunityRegistration | undefined> {
  if (!bookingId || !token || token.length > 200) return undefined;
  const reg = await store.getRegistration({ accessToken: token });
  return reg && safeEqual(reg.bookingId, bookingId) ? reg : undefined;
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return out;
}

/** `ASC-<EVENTCODE>-<8 chars>` (32^8 combinations; the database also enforces uniqueness). */
export function generateBookingId(event: CommunityEvent): string {
  const code = (event.slug || event.id).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 6) || 'EVT';
  return `ASC-${code}-${randomCode(8)}`;
}

/* ------------------------------------------------------------------------------------------ */
/* Rate limiting (in-memory, per process)                                                     */
/* ------------------------------------------------------------------------------------------ */

const buckets = new Map<string, number[]>();

/** The caller's IP as seen by our proxy — never the client-supplied part of X-Forwarded-For. */
export function clientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}

/** Returns true when the key is still within `limit` hits per `windowMs`. */
export function rateLimit(key: string, limit = 10, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

/* ------------------------------------------------------------------------------------------ */
/* Razorpay                                                                                    */
/* ------------------------------------------------------------------------------------------ */

export function razorpayConfig(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return keyId && keySecret ? { keyId, keySecret } : null;
}

/** Creates a Razorpay order for the registration's server-computed fee. */
export async function createRazorpayOrder(reg: Pick<CommunityRegistration, 'bookingId' | 'fee' | 'eventSlug'>): Promise<PaymentInit> {
  const cfg = razorpayConfig();
  if (!cfg) return { provider: 'unconfigured' };
  const amount = Math.round(reg.fee * 100);
  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: reg.bookingId.slice(0, 40),
        notes: { bookingId: reg.bookingId, event: reg.eventSlug },
      }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } };
    if (!res.ok || !data.id) {
      console.error('[razorpay] order creation failed', res.status, data.error?.description);
      return { provider: 'error', message: 'We could not start the payment right now. Please try again in a moment.' };
    }
    return { provider: 'razorpay', keyId: cfg.keyId, orderId: data.id, amount, currency: 'INR' };
  } catch (err) {
    console.error('[razorpay] order creation error', err);
    return { provider: 'error', message: 'We could not reach the payment gateway. Please try again in a moment.' };
  }
}

/** Verifies `razorpay_signature` = HMAC-SHA256(order_id|payment_id, key_secret). */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const cfg = razorpayConfig();
  if (!cfg || !orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac('sha256', cfg.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}
