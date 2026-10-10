/**
 * Event-day check-in (server-only): resolves a scanned ticket QR or a typed booking ID and marks the
 * attendee present (which also issues their certificate — see applyRegistrationAction).
 */
import type { CommunityRegistration } from '@ascend/shared';
import { applyRegistrationAction } from './admin-data';
import { readPrivate, readStore } from './community-store';

export type CheckinStatus = 'checked_in' | 'already' | 'wrong_event' | 'not_confirmed' | 'cancelled' | 'not_found' | 'invalid';

export interface CheckinAttendee {
  id: string;
  bookingId: string;
  name: string;
  eventId: string;
  eventTitle: string;
  city: string;
  organisation?: string;
  attendedAt?: string;
  certificateId?: string;
}

export interface CheckinResult {
  status: CheckinStatus;
  message: string;
  attendee?: CheckinAttendee;
}

const PREFIX = 'ASCEND-CHECKIN:';

function constantTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const toAttendee = (r: CommunityRegistration): CheckinAttendee => ({
  id: r.id,
  bookingId: r.bookingId,
  name: r.name,
  eventId: r.eventId,
  eventTitle: r.eventTitle,
  city: r.city,
  organisation: r.organisation,
  attendedAt: r.attendedAt,
  certificateId: r.certificateId,
});

/**
 * `code` is the full QR text; `bookingId` is the manual fallback (admins are authenticated, so a
 * typed booking ID is trusted). `eventId` (optional) is the event the volunteer is scanning for.
 */
export function checkIn(input: { code?: string; bookingId?: string; eventId?: string }): CheckinResult {
  let bookingId = input.bookingId?.trim().toUpperCase();
  let code: string | undefined;
  if (input.code) {
    const raw = input.code.trim();
    if (!raw.startsWith(PREFIX)) return { status: 'invalid', message: 'This is not an ASCEND ticket QR.' };
    const [b, c] = raw.slice(PREFIX.length).split(':');
    if (!b || !c) return { status: 'invalid', message: 'This ticket QR is damaged. Try again or type the booking ID.' };
    bookingId = b.toUpperCase();
    code = c;
  }
  if (!bookingId) return { status: 'invalid', message: 'Scan a ticket or enter a booking ID.' };

  const reg = readPrivate().registrations.find((r) => r.bookingId.toUpperCase() === bookingId);
  if (!reg) return { status: 'not_found', message: `No booking found for ${bookingId}.` };
  if (code !== undefined && (!reg.checkinCode || !constantTimeEqual(reg.checkinCode, code))) {
    return { status: 'invalid', message: 'This QR does not match the booking — it may be copied or outdated. Check the booking ID.' };
  }

  const attendee = toAttendee(reg);
  if (input.eventId && reg.eventId !== input.eventId) {
    return { status: 'wrong_event', message: `This ticket is for “${reg.eventTitle}”.`, attendee };
  }
  if (reg.status === 'cancelled') return { status: 'cancelled', message: 'This booking was cancelled.', attendee };
  if (reg.status !== 'confirmed') {
    return { status: 'not_confirmed', message: reg.paymentStatus === 'paid' ? 'Booking is not confirmed.' : 'Payment is pending — not valid for entry yet.', attendee };
  }
  if (reg.attended) return { status: 'already', message: 'Already checked in.', attendee };

  const updated = applyRegistrationAction(reg.id, { action: 'set_attended', value: true });
  return { status: 'checked_in', message: 'Checked in.', attendee: toAttendee(updated) };
}

/** Live numbers for the scanner header. */
export function checkinStats(eventId: string) {
  const regs = readPrivate().registrations.filter((r) => r.eventId === eventId && r.status === 'confirmed');
  const present = regs.filter((r) => r.attended);
  const recent = present
    .filter((r) => r.attendedAt)
    .sort((a, b) => (b.attendedAt! > a.attendedAt! ? 1 : -1))
    .slice(0, 8)
    .map(toAttendee);
  const event = readStore().events.find((e) => e.id === eventId);
  return { eventId, eventTitle: event?.title ?? '', confirmed: regs.length, checkedIn: present.length, recent };
}
