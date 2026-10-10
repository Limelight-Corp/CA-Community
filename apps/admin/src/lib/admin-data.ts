/**
 * Server-only admin data operations on top of the file store: dashboard statistics and
 * registration / member / message mutations. Never import this from a client component.
 */
import { randomBytes } from 'crypto';
import type {
  CommunityContactMessage,
  CommunityEvent,
  CommunityMemberApplication,
  CommunityRegistration,
} from '@ascend/shared';
import { mutatePrivate, readPrivate, readStore, writeStore } from './community-store';
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

export function getDashboardData() {
  const store = readStore();
  const priv = readPrivate();
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
 * cancelling a confirmed registration frees it. Everything below is synchronous, so the two
 * read-modify-write cycles cannot interleave with another request in this process.
 */
export function applyRegistrationAction(id: string, input: RegistrationAction): CommunityRegistration {
  const store = readStore();
  let seatDelta = 0;
  let eventIndex = -1;

  const updated = mutatePrivate((data) => {
    const reg = data.registrations.find((r) => r.id === id);
    if (!reg) throw new ActionError('Registration not found', 404);
    eventIndex = store.events.findIndex((e) => e.id === reg.eventId);
    const event = eventIndex >= 0 ? store.events[eventIndex] : undefined;
    const now = new Date().toISOString();

    switch (input.action) {
      case 'mark_paid': {
        if (reg.status === 'cancelled') throw new ActionError('A cancelled registration cannot be marked paid', 409);
        if (reg.paymentStatus === 'paid') throw new ActionError('This registration is already paid', 409);
        if (reg.status !== 'confirmed') {
          if (event && (Number(event.seatsTotal) || 0) > 0 && (Number(event.seatsTaken) || 0) >= Number(event.seatsTotal)) {
            throw new ActionError('The event is full. Increase the seat capacity before confirming this registration.', 409);
          }
          reg.status = 'confirmed';
          seatDelta = 1;
        }
        reg.paymentStatus = 'paid';
        reg.paidAt = now;
        break;
      }
      case 'cancel': {
        if (reg.status === 'cancelled') throw new ActionError('This registration is already cancelled', 409);
        if (reg.status === 'confirmed') seatDelta = -1;
        reg.status = 'cancelled';
        if (reg.paymentStatus === 'pending') reg.paymentStatus = 'failed';
        reg.attended = false;
        break;
      }
      case 'mark_refunded': {
        if (reg.paymentStatus !== 'paid') throw new ActionError('Only paid registrations can be marked refunded', 409);
        if (reg.status === 'confirmed') seatDelta = -1;
        reg.paymentStatus = 'refunded';
        reg.status = 'cancelled';
        reg.attended = false;
        reg.refundedAt = now;
        reg.refundAmount = reg.refundAmount ?? reg.fee;
        break;
      }
      case 'set_attended': {
        if (reg.status !== 'confirmed') throw new ActionError('Only confirmed registrations can be checked in', 409);
        reg.attended = input.value;
        if (input.value) {
          // First check-in issues the certificate; the ID is kept if they are marked absent and back.
          reg.attendedAt = reg.attendedAt ?? now;
          if (!reg.certificateId) {
            const taken = new Set(data.registrations.map((r) => r.certificateId).filter(Boolean));
            reg.certificateId = newCertificateId(taken);
          }
        }
        break;
      }
    }
    reg.updatedAt = now;
    return { ...reg };
  });

  if (seatDelta !== 0 && eventIndex >= 0) {
    // Re-read so a content edit saved since the first read is not overwritten.
    const fresh = readStore();
    const idx = fresh.events.findIndex((e) => e.id === updated.eventId);
    if (idx >= 0) {
      const ev = fresh.events[idx]!;
      ev.seatsTaken = Math.max(0, (Number(ev.seatsTaken) || 0) + seatDelta);
      ev.updatedAt = new Date().toISOString();
      writeStore(fresh);
    }
  }
  return updated;
}

/**
 * Refunds a paid booking in full through Razorpay, then records it like `mark_refunded`
 * (booking cancelled, seat released) plus the gateway refund ID.
 */
export async function refundRegistration(id: string): Promise<CommunityRegistration> {
  const reg = readPrivate().registrations.find((r) => r.id === id);
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

  applyRegistrationAction(id, { action: 'mark_refunded' });
  return mutatePrivate((data) => {
    const r = data.registrations.find((x) => x.id === id)!;
    r.refundId = result.refundId;
    r.refundAmount = r.fee;
    r.updatedAt = new Date().toISOString();
    return { ...r };
  });
}

// ---------------------------------------------------------------------------------------------
// Members & messages
// ---------------------------------------------------------------------------------------------

export function updateMember(
  id: string,
  updates: Partial<CommunityMemberApplication>
): CommunityMemberApplication {
  return mutatePrivate((data) => {
    const m = data.members.find((x) => x.id === id);
    if (!m) throw new ActionError('Application not found', 404);
    Object.assign(m, updates, { id: m.id, createdAt: m.createdAt, updatedAt: new Date().toISOString() });
    return { ...m };
  });
}

export function updateMessageStatus(id: string, status: CommunityContactMessage['status']): CommunityContactMessage {
  return mutatePrivate((data) => {
    const m = data.messages.find((x) => x.id === id);
    if (!m) throw new ActionError('Message not found', 404);
    m.status = status;
    return { ...m };
  });
}

/** Strips the registrant's private access token before data leaves the server. */
export function publicRegistration(r: CommunityRegistration): Omit<CommunityRegistration, 'accessToken'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accessToken, ...rest } = r;
  return rest;
}
