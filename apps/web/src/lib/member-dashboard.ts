/**
 * Data for the member dashboard (server only). Bookings are linked to an account by email, and
 * only once that email is verified — otherwise anyone could sign up with someone else's email
 * and see their bookings.
 */
import { MEMBERSHIP_PLANS, ORG_WINGS, wingSlug, type CommunityEvent, type CommunityResource } from '@ascend/shared';
import { getItems, readPrivate } from './community-store';
import { certificatePdfPath, isCertificateValid, verifyUrl } from './certificates';
import { eventDate, formatEventDate, locationLabel } from './events';
import { isApprovedMember, membershipFor, type MemberAccount } from './member-accounts';
import { receiptKind, receiptPdfPath } from './receipts';
import { resourceDownloadUrl, safeUrl } from './content';

export interface DashboardBooking {
  bookingId: string;
  eventTitle: string;
  eventSlug: string;
  when: string;
  where: string;
  upcoming: boolean;
  status: 'confirmed' | 'pending_payment' | 'cancelled';
  paymentStatus: string;
  fee: number;
  paidAt?: string;
  bookingUrl: string;
  payUrl?: string;
  receiptUrl?: string;
  certificate?: { id: string; pdfUrl: string; verifyUrl: string };
}

export interface DashboardData {
  account: {
    name: string;
    email: string;
    mobile?: string;
    emailVerified: boolean;
    memberSince: string;
    profile: MemberAccount['profile'];
  };
  membership: { plan: string; status: 'pending' | 'approved' | 'rejected'; appliedAt: string; wings: { name: string; slug: string }[] } | null;
  isMember: boolean;
  bookings: DashboardBooking[];
  resources: { id: string; title: string; category: string; format: string; url?: string }[];
  membersOnlyCount: number;
}

export function dashboardData(account: MemberAccount): DashboardData {
  const verified = !!account.emailVerifiedAt;
  const events = getItems<CommunityEvent>('events');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings: DashboardBooking[] = verified
    ? readPrivate()
        .registrations.filter((r) => r.email.toLowerCase() === account.email)
        .map((r) => {
          const event = events.find((e) => e.id === r.eventId);
          const q = `?t=${encodeURIComponent(r.accessToken)}`;
          const id = encodeURIComponent(r.bookingId);
          return {
            bookingId: r.bookingId,
            eventTitle: r.eventTitle,
            eventSlug: r.eventSlug,
            when: event
              ? `${formatEventDate(event, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${event.time ? ` · ${event.time}` : ''}`
              : '',
            where: event ? locationLabel(event) : '',
            upcoming: event ? eventDate(event).getTime() >= today.getTime() : false,
            status: r.status,
            paymentStatus: r.paymentStatus,
            fee: r.fee,
            paidAt: r.paidAt,
            bookingUrl: `/registration/${id}${q}`,
            payUrl: r.status === 'pending_payment' && r.fee > 0 ? `/registration/${id}/pay${q}` : undefined,
            receiptUrl: receiptKind(r) ? receiptPdfPath(r.bookingId, r.accessToken) : undefined,
            certificate:
              isCertificateValid(r) && r.certificateId
                ? { id: r.certificateId, pdfUrl: certificatePdfPath(r.certificateId, r.accessToken), verifyUrl: verifyUrl(r.certificateId) }
                : undefined,
            sortKey: event ? eventDate(event).getTime() : 0,
          };
        })
        .sort((a, b) => (a.upcoming === b.upcoming ? (a.upcoming ? a.sortKey - b.sortKey : b.sortKey - a.sortKey) : a.upcoming ? -1 : 1))
        .map(({ sortKey: _sortKey, ...b }) => b)
    : [];

  const app = membershipFor(account);
  const isMember = isApprovedMember(account);
  const membersOnly = getItems<CommunityResource>('resources', true).filter((r) => r.isMembersOnly);

  return {
    account: {
      name: account.name,
      email: account.email,
      mobile: account.mobile,
      emailVerified: verified,
      memberSince: account.createdAt,
      profile: account.profile,
    },
    membership: app
      ? {
          plan: MEMBERSHIP_PLANS.find((p) => p.key === app.plan)?.name ?? app.plan,
          status: app.status,
          appliedAt: app.createdAt,
          wings: (app.interests ?? [])
            .map((n) => ORG_WINGS.find((w) => w.number === n))
            .filter((w): w is (typeof ORG_WINGS)[number] => !!w)
            .map((w) => ({ name: w.name, slug: wingSlug(w.name) })),
        }
      : null,
    isMember,
    bookings,
    resources: isMember
      ? membersOnly.map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          format: r.format,
          url: safeUrl(r.fileUrl) ? resourceDownloadUrl(r.id) : undefined,
        }))
      : [],
    membersOnlyCount: membersOnly.length,
  };
}
