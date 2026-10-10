import {
  bookingCancelledEmail,
  emailBookingFrom,
  paymentConfirmedEmail,
  type CommunityEvent,
  type CommunityRegistration,
} from '@ascend/shared';
import { getItems } from './community-store';
import { emailBrand, queueMail, siteUrl } from './mailer';

/** Attendee emails triggered by admin actions on a registration (checklist §17). */
export function notifyRegistrationAction(reg: CommunityRegistration, action: string): void {
  const event = getItems<CommunityEvent>('events').find((e) => e.id === reg.eventId);
  const booking = emailBookingFrom(reg, event, siteUrl());
  const brand = emailBrand();
  switch (action) {
    case 'mark_paid':
      // Payment recorded by the team (e.g. bank transfer) — the attendee gets the receipt.
      queueMail(reg.email, paymentConfirmedEmail(brand, booking));
      break;
    case 'cancel':
      queueMail(reg.email, bookingCancelledEmail(brand, booking));
      break;
    case 'mark_refunded':
      queueMail(reg.email, bookingCancelledEmail(brand, booking, { refunded: true }));
      break;
  }
}
