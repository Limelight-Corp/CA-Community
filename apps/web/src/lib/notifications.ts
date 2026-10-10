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
  type CommunityContactMessage,
  type CommunityEvent,
  type CommunityMemberApplication,
  type CommunityRegistration,
} from '@ascend/shared';
import { getItems } from './community-store';
import { adminRecipients, adminUrl, emailBrand, queueMail } from './mailer';
import { siteUrl } from './seo';

/**
 * Who gets which email (checklist §17). All sends are queued — a mail failure never breaks the
 * request that triggered it.
 */

function eventFor(reg: CommunityRegistration): CommunityEvent | undefined {
  return getItems<CommunityEvent>('events').find((e) => e.id === reg.eventId);
}

function adminRegistrationsUrl(reg: CommunityRegistration): string {
  return adminUrl(`/events/${encodeURIComponent(reg.eventId)}/registrations`);
}

/** New booking: confirmation (free) or "complete your payment" (paid) + admin alert. */
export function notifyRegistrationCreated(reg: CommunityRegistration, event?: CommunityEvent): void {
  const brand = emailBrand();
  const booking = emailBookingFrom(reg, event ?? eventFor(reg), siteUrl());
  queueMail(reg.email, reg.status === 'confirmed' ? registrationConfirmedEmail(brand, booking) : paymentPendingEmail(brand, booking));
  queueMail(adminRecipients(), adminNewRegistrationEmail(brand, booking, adminRegistrationsUrl(reg)), { replyTo: reg.email });
}

/** Payment verified: receipt to the attendee + admin alert. */
export function notifyPaymentConfirmed(reg: CommunityRegistration): void {
  const brand = emailBrand();
  const booking = emailBookingFrom(reg, eventFor(reg), siteUrl());
  queueMail(reg.email, paymentConfirmedEmail(brand, booking));
  queueMail(adminRecipients(), adminPaymentReceivedEmail(brand, booking, adminRegistrationsUrl(reg)), { replyTo: reg.email });
}

/** A payment attempt failed (sent once per attempt; a retry starts a new attempt). */
export function notifyPaymentFailed(reg: CommunityRegistration): void {
  const brand = emailBrand();
  queueMail(reg.email, paymentFailedEmail(brand, emailBookingFrom(reg, eventFor(reg), siteUrl())));
}

/** Contact form / support-assistant lead → admin. */
export function notifyContactMessage(msg: CommunityContactMessage): void {
  queueMail(adminRecipients(), adminContactMessageEmail(emailBrand(), msg, adminUrl('/messages')), { replyTo: msg.email });
}

/** Membership application → acknowledgement to the applicant + admin alert. */
export function notifyMemberApplication(app: CommunityMemberApplication): void {
  const brand = emailBrand();
  const plan = MEMBERSHIP_PLANS.find((p) => p.key === app.plan)?.name ?? app.plan;
  queueMail(app.email, memberApplicationEmail(brand, { name: app.name, plan }));
  queueMail(
    adminRecipients(),
    adminMemberApplicationEmail(brand, { name: app.name, email: app.email, mobile: app.mobile, city: app.city, plan }, adminUrl('/members')),
    { replyTo: app.email }
  );
}
