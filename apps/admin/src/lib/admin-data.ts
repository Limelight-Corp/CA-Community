/**
 * Server-only admin data operations on top of the file store: dashboard statistics and
 * registration / member / message mutations. Never import this from a client component.
 */
import { randomBytes } from 'crypto';
import {
  newMembershipReceiptId,
  recordMembershipPayment,
  type CommunityContactMessage,
  type CommunityEvent,
  type CommunityMemberApplication,
  type CommunityRegistration,
  type MembershipPayment,
} from '@ascend/shared';
import { readPrivate, readStore, store } from './community-store';
import { todayISO } from './format';
import { razorpayConfigured, refundPayment } from './razorpay';

// ---------------------------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------------------------

export interface EventStats {
  total: number;
  confirmed: number;
  paid: number;
  pending: number;
  cancelled: number;
  attended: number;
  revenue: number;
  seatsTotal: number;
  seatsTaken: number;
  seatsAvailable: number;
}

/** Revenue counts payments actually received (paid), net of refunds. */
export function registrationRevenue(rows: CommunityRegistration[]): number {
  return rows.reduce((sum, r) => sum + (r.paymentStatus === 'paid' ? Number(r.fee) || 0 : 0), 0);
}

export function eventStats(event: CommunityEvent, regs: CommunityRegistration[]): EventStats {
  const rows = regs.filter((r) => r.eventId === event.id);
  const seatsTotal = Number(event.seatsTotal) || 0;
  const seatsTaken = Number(event.seatsTaken) || 0;
  return {
    total: rows.length,
    confirmed: rows.filter((r) => r.status === 'confirmed').length,
    paid: rows.filter((r) => r.paymentStatus === 'paid').length,
    pending: rows.filter((r) => r.status === 'pending_payment' || r.paymentStatus === 'pending').length,
    cancelled: rows.filter((r) => r.status === 'cancelled').length,
    attended: rows.filter((r) => r.attended).length,
    revenue: registrationRevenue(rows),
    seatsTotal,
    seatsTaken,
    seatsAvailable: Math.max(0, seatsTotal - seatsTaken),
  };
}

export function isUpcoming(event: CommunityEvent): boolean {
  return (event.date ?? '') >= todayISO();
}

export function sortEventsByDate(events: CommunityEvent[]): CommunityEvent[] {
  return [...events].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
}

export async function getDashboardData() {
  const store = await readStore();
  const priv = await readPrivate();
  const regs = priv.registrations;
  const upcoming = sortEventsByDate(store.events.filter(isUpcoming));
  return {
    kpis: {
      upcomingEvents: upcoming.length,
      totalRegistrations: regs.filter((r) => r.status !== 'cancelled').length,
      paid: regs.filter((r) => r.paymentStatus === 'paid').length,
      pending: regs.filter((r) => r.status === 'pending_payment' || r.paymentStatus === 'pending').length,
      revenue: registrationRevenue(regs),
      newMembers: priv.members.filter((m) => m.status === 'pending').length,
      unreadMessages: priv.messages.filter((m) => m.status === 'new').length,
    },
    recentRegistrations: [...regs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    upcomingEvents: upcoming.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------------------------

export type RegistrationAction =
  | { action: 'mark_paid' }
  | { action: 'cancel' }
  | { action: 'mark_refunded' }
  | { action: 'set_attended'; value: boolean };

const CERT_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** `ASC-CERT-XXXXXXXX`, unique among existing certificate IDs. */
function newCertificateId(taken: Set<string | undefined>): string {
  for (;;) {
    const bytes = randomBytes(8);
    let code = '';
    for (const b of bytes) code += CERT_ALPHABET[b % CERT_ALPHABET.length];
    const id = `ASC-CERT-${code}`;
    if (!taken.has(id)) return id;
  }
}

export class ActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * Applies an admin action to a registration and keeps the event's `seatsTaken` consistent:
 * a registration holds a seat while its status is `confirmed`. Confirming takes a seat, and
 * cancelling a confirmed registration frees it. Runs in one transaction with the booking and the
 * event rows locked, so it cannot interleave with a payment, a check-in or another admin.
 */
export async function applyRegistrationAction(id: string, input: RegistrationAction): Promise<CommunityRegistration> {
  return store.prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ event_id: string }[]>`SELECT event_id FROM event_registrations WHERE id = ${id} FOR UPDATE`;
    if (!locked.length) throw new ActionError('Registration not found', 404);
    await tx.$queryRaw`SELECT id FROM events WHERE id = ${locked[0]!.event_id} FOR UPDATE`;
    const reg = (await store.getRegistration({ id }, tx))!;
    const event = await store.getEvent({ id: reg.eventId }, tx);
    const now = new Date().toISOString();
    const patch: Partial<CommunityRegistration> = {};
    let seatDelta = 0;

    switch (input.action) {
      case 'mark_paid': {
        if (reg.status === 'cancelled') throw new ActionError('A cancelled registration cannot be marked paid', 409);
        if (reg.paymentStatus === 'paid') throw new ActionError('This registration is already paid', 409);
        if (reg.status !== 'confirmed') {
          if (event && (Number(event.seatsTotal) || 0) > 0 && (Number(event.seatsTaken) || 0) >= Number(event.seatsTotal)) {
            throw new ActionError('The event is full. Increase the seat capacity before confirming this registration.', 409);
          }
          patch.status = 'confirmed';
          seatDelta = 1;
        }
        patch.paymentStatus = 'paid';
        patch.paidAt = now;
        break;
      }
      case 'cancel': {
        if (reg.status === 'cancelled') throw new ActionError('This registration is already cancelled', 409);
        if (reg.status === 'confirmed') seatDelta = -1;
        patch.status = 'cancelled';
        if (reg.paymentStatus === 'pending') patch.paymentStatus = 'failed';
        patch.attended = false;
        break;
      }
      case 'mark_refunded': {
        if (reg.paymentStatus !== 'paid') throw new ActionError('Only paid registrations can be marked refunded', 409);
        if (reg.status === 'confirmed') seatDelta = -1;
        patch.paymentStatus = 'refunded';
        patch.status = 'cancelled';
        patch.attended = false;
        patch.refundedAt = now;
        patch.refundAmount = reg.refundAmount ?? reg.fee;
        break;
      }
      case 'set_attended': {
        if (reg.status !== 'confirmed') throw new ActionError('Only confirmed registrations can be checked in', 409);
        patch.attended = input.value;
        if (input.value) {
          // First check-in issues the certificate; the ID is kept if they are marked absent and back.
          patch.attendedAt = reg.attendedAt ?? now;
          // Random id; the database guarantees uniqueness.
          if (!reg.certificateId) patch.certificateId = newCertificateId(new Set());
        }
        break;
      }
    }

    const updated = (await store.updateRegistration({ id }, patch, tx))!;
    if (seatDelta > 0) await tx.event.update({ where: { id: reg.eventId }, data: { seatsTaken: { increment: seatDelta } } });
    if (seatDelta < 0) await tx.$executeRaw`UPDATE events SET seats_taken = GREATEST(seats_taken + ${seatDelta}, 0), updated_at = now() WHERE id = ${reg.eventId}`;
    return updated;
  });
}

/**
 * Refunds a paid booking in full through Razorpay, then records it like `mark_refunded`
 * (booking cancelled, seat released) plus the gateway refund ID.
 */
export async function refundRegistration(id: string): Promise<CommunityRegistration> {
  const reg = await store.getRegistration({ id });
  if (!reg) throw new ActionError('Registration not found', 404);
  if (reg.paymentStatus !== 'paid') throw new ActionError('Only paid registrations can be refunded', 409);
  if (!reg.gatewayPaymentId) {
    throw new ActionError('This payment was recorded offline — refund it outside the gateway, then use "Mark refunded".', 409);
  }
  if (!razorpayConfigured()) {
    throw new ActionError('Razorpay keys are not configured for the admin console. Refund from the Razorpay dashboard, then use "Mark refunded".', 409);
  }

  const result = await refundPayment(reg.gatewayPaymentId, reg.fee, reg.bookingId);
  if (!result.ok) throw new ActionError(result.error, 502);

  await applyRegistrationAction(id, { action: 'mark_refunded' });
  return (await store.updateRegistration({ id }, { refundId: result.refundId, refundAmount: reg.fee }))!;
}

// ---------------------------------------------------------------------------------------------
// Members & messages
// ---------------------------------------------------------------------------------------------

export async function updateMember(id: string, updates: Partial<CommunityMemberApplication>): Promise<CommunityMemberApplication> {
  const m = await store.updateMember(id, updates);
  if (!m) throw new ActionError('Application not found', 404);
  return m;
}

/**
 * Marks a membership paid outside the gateway (cash, bank transfer, complimentary) for one
 * 12-month term at the given amount. Only approved applications can be paid.
 */
export async function recordOfflineMembershipPayment(
  id: string,
  amount: number,
  recordedBy: string
): Promise<{ app: CommunityMemberApplication; payment: MembershipPayment; renewal: boolean }> {
  return store.prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM memberships WHERE id = ${id} FOR UPDATE`;
    if (!locked.length) throw new ActionError('Application not found', 404);
    const m = (await store.getMember({ id }, tx))!;
    if (m.status !== 'approved') throw new ActionError('Approve the application before recording a payment', 409);
    const renewal = (m.payments?.length ?? 0) > 0;
    const next = structuredClone(m);
    const { payment } = recordMembershipPayment(next, { id: newMembershipReceiptId(new Set()), amount, method: 'offline', recordedBy });
    const app = (await store.addMemberPayment(id, payment, { validUntil: next.validUntil!, clearOrder: true }, tx)) ?? next;
    return { app, payment, renewal };
  });
}

export async function updateMessageStatus(id: string, status: CommunityContactMessage['status']): Promise<CommunityContactMessage> {
  const m = await store.setMessageStatus(id, status);
  if (!m) throw new ActionError('Message not found', 404);
  return m;
}

/** Strips the registrant's private access token before data leaves the server. */
export function publicRegistration(r: CommunityRegistration): Omit<CommunityRegistration, 'accessToken'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken, ...rest } = r;
  return rest;
}
