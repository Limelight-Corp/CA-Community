/**
 * Event reminder emails (server only).
 *
 * `sendDueReminders()` emails every confirmed attendee of an event happening today or tomorrow
 * (India time) that they haven't been reminded about yet. Each booking is stamped with
 * `reminderSentAt` *before* its email is queued, so overlapping runs never double-send.
 * Rescheduling an event in the admin clears the stamps, so attendees are reminded of the new date.
 *
 * Runs hourly inside the web server (src/instrumentation.ts) and can also be triggered by a
 * cron service via GET /api/cron/reminders.
 */
import {
  emailBookingFrom,
  eventReminderEmail,
  MEMBERSHIP_PLANS,
  membershipFeeFor,
  membershipRenewalEmail,
  membershipState,
  RENEWAL_REMINDER_DAYS,
  waEventReminder,
  type CommunityEvent,
  type CommunityMemberApplication,
  type CommunityRegistration,
} from '@ascend/shared';
import { getItems, getSettings, mutatePrivate } from './community-store';
import { emailBrand, queueMail } from './mailer';
import { queueWhatsApp } from './whatsapp';
import { siteUrl } from './seo';

const IST_OFFSET_MS = 5.5 * 3600_000;

/** YYYY-MM-DD of `d` in India time. */
function istDate(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Event start as a UTC timestamp, parsing times like "7:00 PM", "19:00" or "10 AM" (IST). */
export function eventStartUtc(e: Pick<CommunityEvent, 'date' | 'time'>): number | null {
  const m = /(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?/i.exec(e.time || '');
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = m[3]?.toLowerCase();
  if (ap === 'p' && h < 12) h += 12;
  if (ap === 'a' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  const [y, mo, d] = e.date.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return Date.UTC(y, mo - 1, d, h, min) - IST_OFFSET_MS;
}

export interface ReminderRun {
  checkedEvents: number;
  sent: number;
  bookings: string[];
}

export function sendDueReminders(now = new Date()): ReminderRun {
  const today = istDate(now);
  const tomorrow = istDate(new Date(now.getTime() + 24 * 3600_000));
  const events = getItems<CommunityEvent>('events', true).filter((e) => {
    if (e.cancelledAt || (e.date !== today && e.date !== tomorrow)) return false;
    const start = eventStartUtc(e);
    return start === null || start > now.getTime(); // never remind about an event that has started
  });
  if (!events.length) return { checkedEvents: 0, sent: 0, bookings: [] };

  const ids = new Set(events.map((e) => e.id));
  const stamp = now.toISOString();
  const due = mutatePrivate<CommunityRegistration[]>((data) => {
    const picked: CommunityRegistration[] = [];
    for (const r of data.registrations) {
      if (!ids.has(r.eventId) || r.status !== 'confirmed' || r.reminderSentAt) continue;
      r.reminderSentAt = stamp;
      picked.push({ ...r });
    }
    return picked;
  });

  const brand = emailBrand();
  for (const r of due) {
    const event = events.find((e) => e.id === r.eventId)!;
    const mapUrl =
      event.mode === 'Offline'
        ? event.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue, event.city].filter(Boolean).join(', '))}`
        : undefined;
    const booking = emailBookingFrom(r, event, siteUrl());
    queueMail(r.email, eventReminderEmail(brand, booking, { today: event.date === today, mapUrl, online: event.mode === 'Online' }));
    if (r.whatsappOptIn) queueWhatsApp(r.mobile, waEventReminder(booking, event.date === today, event.time));
  }
  return { checkedEvents: events.length, sent: due.length, bookings: due.map((r) => r.bookingId) };
}

/**
 * Membership renewal reminders: one email per membership period, sent when an active membership
 * is within RENEWAL_REMINDER_DAYS of expiry. Stamped (renewalReminderFor = validUntil) first.
 */
export function sendMembershipRenewalReminders(now = new Date()): { sent: number } {
  const horizon = now.getTime() + RENEWAL_REMINDER_DAYS * 24 * 3600_000;
  const due = mutatePrivate<CommunityMemberApplication[]>((data) => {
    const picked: CommunityMemberApplication[] = [];
    for (const m of data.members) {
      if (membershipState(m, now) !== 'active' || !m.validUntil) continue;
      if (Date.parse(m.validUntil) > horizon || m.renewalReminderFor === m.validUntil) continue;
      m.renewalReminderFor = m.validUntil;
      picked.push({ ...m });
    }
    return picked;
  });
  const brand = emailBrand();
  const settings = getSettings();
  for (const m of due) {
    queueMail(
      m.email,
      membershipRenewalEmail(brand, {
        name: m.name,
        plan: MEMBERSHIP_PLANS.find((p) => p.key === m.plan)?.name ?? m.plan,
        fee: membershipFeeFor(m.plan, settings),
        validUntil: m.validUntil!,
        payUrl: `${siteUrl()}/dashboard`,
      })
    );
  }
  return { sent: due.length };
}
