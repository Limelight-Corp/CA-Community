import {
  bookingCancelledEmail,
  emailBookingFrom,
  eventCancelledEmail,
  eventUpdatedEmail,
  MEMBERSHIP_PLANS,
  membershipApprovedEmail,
  membershipPaidEmail,
  paymentConfirmedEmail,
  waBookingConfirmed,
  waEventCancelled,
  waEventUpdated,
  type CommunityEvent,
  type CommunityMemberApplication,
  type CommunityRegistration,
  type MembershipPayment,
} from '@ascend/shared';
import { getItems, readPrivate, store } from './community-store';
import { emailBrand, queueMail, siteUrl } from './mailer';
import { queueWhatsApp } from './whatsapp';

/** Attendee emails triggered by admin actions on a registration (checklist §17). */
export async function notifyRegistrationAction(reg: CommunityRegistration, action: string): Promise<void> {
  const event = (await getItems<CommunityEvent>('events')).find((e) => e.id === reg.eventId);
  const booking = emailBookingFrom(reg, event, siteUrl());
  const brand = await emailBrand();
  switch (action) {
    case 'mark_paid':
      // Payment recorded by the team (e.g. bank transfer) — the attendee gets the receipt.
      queueMail(reg.email, paymentConfirmedEmail(brand, booking));
      if (reg.whatsappOptIn) queueWhatsApp(reg.mobile, waBookingConfirmed(booking));
      break;
    case 'cancel':
      queueMail(reg.email, bookingCancelledEmail(brand, booking));
      break;
    case 'mark_refunded':
      queueMail(reg.email, bookingCancelledEmail(brand, booking, { refunded: true }));
      break;
  }
}

/** Bookings that should hear about changes to an event (confirmed or awaiting payment). */
async function activeRegistrations(eventId: string): Promise<CommunityRegistration[]> {
  return (await readPrivate()).registrations.filter((r) => r.eventId === eventId && (r.status === 'confirmed' || r.status === 'pending_payment'));
}

/** Emails everyone registered that the event is cancelled. Returns how many were emailed. */
export async function notifyEventCancelled(event: CommunityEvent, note?: string): Promise<number> {
  const brand = await emailBrand();
  const regs = await activeRegistrations(event.id);
  for (const r of regs) {
    const booking = emailBookingFrom(r, event, siteUrl());
    queueMail(r.email, eventCancelledEmail(brand, booking, { note, paid: r.paymentStatus === 'paid' }));
    if (r.whatsappOptIn) queueWhatsApp(r.mobile, waEventCancelled(booking, note, r.paymentStatus === 'paid'));
  }
  return regs.length;
}

export type EventChange = { label: string; from: string; to: string };

/** What attendees care about when an event is edited: when and where it happens. */
export function eventChanges(before: CommunityEvent, after: CommunityEvent): EventChange[] {
  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return y ? new Date(y, (m || 1) - 1, day || 1).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : d;
  };
  const place = (e: CommunityEvent) => (e.mode === 'Online' ? 'Online' : [e.venue, e.city].filter(Boolean).join(', '));
  const out: EventChange[] = [];
  if (before.date !== after.date) out.push({ label: 'Date', from: fmtDate(before.date), to: fmtDate(after.date) });
  if (before.time !== after.time || (before.endTime || '') !== (after.endTime || '')) {
    const t = (e: CommunityEvent) => `${e.time}${e.endTime ? ` – ${e.endTime}` : ''}`;
    out.push({ label: 'Time', from: t(before), to: t(after) });
  }
  if (place(before) !== place(after)) out.push({ label: 'Venue', from: place(before), to: place(after) });
  return out;
}

/**
 * Emails everyone registered about changed date/time/venue and clears their reminder stamp,
 * so they are reminded again before the new date. Returns how many were emailed.
 */
export async function notifyEventUpdated(event: CommunityEvent, changes: EventChange[]): Promise<number> {
  if (!changes.length) return 0;
  const regs = await activeRegistrations(event.id);
  if (changes.some((c) => c.label === 'Date' || c.label === 'Time')) {
    // Reset the reminder stamp so everyone is reminded again before the new date/time.
    await store.prisma.eventRegistration.updateMany({ where: { eventId: event.id }, data: { reminderSentAt: null } });
  }
  const brand = await emailBrand();
  for (const r of regs) {
    const booking = emailBookingFrom(r, event, siteUrl());
    queueMail(r.email, eventUpdatedEmail(brand, booking, changes));
    if (r.whatsappOptIn) queueWhatsApp(r.mobile, waEventUpdated(booking, changes));
  }
  return regs.length;
}

/** Approval: fixes the fee (if not yet paid) and emails the applicant a link to pay. */
export async function notifyMembershipApproved(app: CommunityMemberApplication): Promise<void> {
  queueMail(
    app.email,
    membershipApprovedEmail(await emailBrand(), {
      name: app.name,
      plan: MEMBERSHIP_PLANS.find((p) => p.key === app.plan)?.name ?? app.plan,
      fee: app.membershipFee ?? 0,
      payUrl: `${siteUrl()}/dashboard`,
    })
  );
}

/** Receipt for a payment recorded offline by the team. */
export async function notifyMembershipPaidOffline(app: CommunityMemberApplication, payment: MembershipPayment, renewal: boolean): Promise<void> {
  queueMail(
    app.email,
    membershipPaidEmail(await emailBrand(), {
      name: app.name,
      plan: MEMBERSHIP_PLANS.find((p) => p.key === app.plan)?.name ?? app.plan,
      amount: payment.amount,
      receiptId: payment.id,
      validUntil: payment.validUntil,
      renewal,
      dashboardUrl: `${siteUrl()}/dashboard`,
    })
  );
}
