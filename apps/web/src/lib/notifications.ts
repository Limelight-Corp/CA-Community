import {
  adminContactMessageEmail,
  adminMemberApplicationEmail,
  adminNewRegistrationEmail,
  adminPaymentReceivedEmail,
  emailBookingFrom,
  memberApplicationEmail,
  MEMBERSHIP_PLANS,
  paymentConfirmedEmail,
  paymentFailedEmail,
  paymentPendingEmail,
  registrationConfirmedEmail,
  waBookingConfirmed,
  type CommunityContactMessage,
  type CommunityEvent,
  type CommunityMemberApplication,
  type CommunityRegistration,
} from '@ascend/shared';
import { getItems } from './community-store';
import { adminRecipients, adminUrl, emailBrand, queueMail } from './mailer';
import { queueWhatsApp } from './whatsapp';
import { siteUrl } from './seo';

/**
 * Who gets which email (checklist §17). All sends are queued — a mail failure never breaks the
 * request that triggered it.
 */

async function eventFor(reg: CommunityRegistration): Promise<CommunityEvent | undefined> {
  return (await getItems<CommunityEvent>('events')).find((e) => e.id === reg.eventId);
}

function adminRegistrationsUrl(reg: CommunityRegistration): string {
  return adminUrl(`/events/${encodeURIComponent(reg.eventId)}/registrations`);
}

/** New booking: confirmation (free) or "complete your payment" (paid) + admin alert. */
export async function notifyRegistrationCreated(reg: CommunityRegistration, event?: CommunityEvent): Promise<void> {
  const brand = await emailBrand();
  const booking = emailBookingFrom(reg, event ?? (await eventFor(reg)), siteUrl());
  queueMail(reg.email, reg.status === 'confirmed' ? registrationConfirmedEmail(brand, booking) : paymentPendingEmail(brand, booking));
  if (reg.status === 'confirmed' && reg.whatsappOptIn) queueWhatsApp(reg.mobile, waBookingConfirmed(booking));
  queueMail(await adminRecipients(), adminNewRegistrationEmail(brand, booking, adminRegistrationsUrl(reg)), { replyTo: reg.email });
}

/** Payment verified: receipt to the attendee + admin alert. */
export async function notifyPaymentConfirmed(reg: CommunityRegistration): Promise<void> {
  const brand = await emailBrand();
  const booking = emailBookingFrom(reg, await eventFor(reg), siteUrl());
  queueMail(reg.email, paymentConfirmedEmail(brand, booking));
  if (reg.whatsappOptIn) queueWhatsApp(reg.mobile, waBookingConfirmed(booking));
  queueMail(await adminRecipients(), adminPaymentReceivedEmail(brand, booking, adminRegistrationsUrl(reg)), { replyTo: reg.email });
}

/** A payment attempt failed (sent once per attempt; a retry starts a new attempt). */
export async function notifyPaymentFailed(reg: CommunityRegistration): Promise<void> {
  const brand = await emailBrand();
  queueMail(reg.email, paymentFailedEmail(brand, emailBookingFrom(reg, await eventFor(reg), siteUrl())));
}

/** Contact form / support-assistant lead → admin. */
export async function notifyContactMessage(msg: CommunityContactMessage): Promise<void> {
  queueMail(await adminRecipients(), adminContactMessageEmail(await emailBrand(), msg, adminUrl('/messages')), { replyTo: msg.email });
}

/** Membership application → acknowledgement to the applicant + admin alert. */
export async function notifyMemberApplication(app: CommunityMemberApplication): Promise<void> {
  const brand = await emailBrand();
  const plan = MEMBERSHIP_PLANS.find((p) => p.key === app.plan)?.name ?? app.plan;
  queueMail(app.email, memberApplicationEmail(brand, { name: app.name, plan }));
  queueMail(
    await adminRecipients(),
    adminMemberApplicationEmail(brand, { name: app.name, email: app.email, mobile: app.mobile, city: app.city, plan }, adminUrl('/members')),
    { replyTo: app.email }
  );
}
