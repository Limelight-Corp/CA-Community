/**
 * Pure filter helpers shared by the client tables and the server export routes, so an export
 * always contains exactly the rows the admin is looking at.
 */
import type {
  CommunityContactMessage,
  CommunityMemberApplication,
  CommunityRegistration,
} from '@ascend/shared';

/** A registration as handed to the browser (no registrant access token). */
export type AdminRegistration = Omit<CommunityRegistration, 'accessToken'>;

function matches(q: string, ...values: (string | undefined)[]): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return values.some((v) => (v ?? '').toLowerCase().includes(needle));
}

export interface RegistrationFilter {
  q?: string;
  event?: string;
  payment?: string;
  status?: string;
}

export function filterRegistrations<T extends AdminRegistration>(rows: T[], f: RegistrationFilter): T[] {
  return rows.filter(
    (r) =>
      (!f.event || r.eventId === f.event) &&
      (!f.payment || r.paymentStatus === f.payment) &&
      (!f.status || r.status === f.status) &&
      matches(f.q ?? '', r.name, r.email, r.mobile, r.bookingId, r.city, r.organisation, r.membershipNo, r.eventTitle)
  );
}

/** Registrations that involve money (everything except free registrations). */
export function paymentRows<T extends AdminRegistration>(rows: T[]): T[] {
  return rows.filter((r) => r.paymentStatus !== 'not_required' || r.fee > 0);
}

export interface PaymentFilter {
  q?: string;
  event?: string;
  payment?: string;
}

export function filterPayments<T extends AdminRegistration>(rows: T[], f: PaymentFilter): T[] {
  return paymentRows(rows).filter(
    (r) =>
      (!f.event || r.eventId === f.event) &&
      (!f.payment || r.paymentStatus === f.payment) &&
      matches(f.q ?? '', r.gatewayOrderId, r.gatewayPaymentId, r.name, r.email, r.bookingId, r.eventTitle, r.mobile)
  );
}

export interface MemberFilter {
  q?: string;
  plan?: string;
  status?: string;
  city?: string;
}

export function filterMembers(rows: CommunityMemberApplication[], f: MemberFilter): CommunityMemberApplication[] {
  const city = (f.city ?? '').trim().toLowerCase();
  return rows.filter(
    (m) =>
      (!f.plan || m.plan === f.plan) &&
      (!f.status || m.status === f.status) &&
      (!city || (m.city ?? '').trim().toLowerCase() === city) &&
      matches(f.q ?? '', m.name, m.email, m.mobile, m.city, m.organisation, m.membershipNo)
  );
}

/** `view`: "inbox" (new + read), "new", "read" or "archived". */
export function filterMessages(rows: CommunityContactMessage[], view: string, q: string): CommunityContactMessage[] {
  return rows.filter(
    (m) =>
      (view === 'inbox' ? m.status !== 'archived' : m.status === view) &&
      matches(q, m.name, m.email, m.subject, m.message)
  );
}

export function byNewest<T extends { createdAt?: string }>(a: T, b: T): number {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}
