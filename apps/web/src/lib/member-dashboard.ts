/**
 * Data for the member dashboard (server only). Bookings are linked to an account by email, and
 * only once that email is verified — otherwise anyone could sign up with someone else's email
 * and see their bookings.
 */
import {
  MEMBERSHIP_PLANS,
  membershipState,
  ORG_WINGS,
  wingSlug,
  type CommunityEvent,
  type CommunityResource,
  type MembershipState,
  type MentorProfile,
  type MentorshipRequest,
} from '@ascend/shared';
import { feeFor } from './membership';
import { activeMenteeCount, approvedMentors, wingName } from './mentorship';
import { razorpayConfig } from '../app/api/registrations/_lib/server';
import { getItems, getSettings, readPrivate } from './community-store';
import { certificatePdfPath, isCertificateValid, verifyUrl } from './certificates';
import { eventDate, formatEventDate, locationLabel } from './events';
import { isApprovedMember, membershipFor, type MemberAccount } from './member-accounts';
import { receiptKind, receiptPdfPath } from './receipts';
import { resourceDownloadUrl, safeUrl } from './content';
import { mailConfigured } from './mailer';

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
  membership: {
    plan: string;
    status: 'pending' | 'approved' | 'rejected';
    state: MembershipState;
    appliedAt: string;
    validUntil?: string;
    /** Amount of the next payment (first payment or renewal). */
    fee: number;
    /** Online payment possible (Razorpay configured). */
    canPayOnline: boolean;
    payments: { id: string; amount: number; paidAt: string; validUntil: string; method: string; receiptUrl: string }[];
    wings: { name: string; slug: string }[];
  } | null;
  isMember: boolean;
  bookings: DashboardBooking[];
  resources: { id: string; title: string; category: string; format: string; url?: string }[];
  membersOnlyCount: number;
  siteName: string;
  /** SMTP is set up; otherwise emails only land in data/outbox/. */
  mailEnabled: boolean;
  /** Mentorship programme (active members only; null otherwise). */
  mentorship: MentorshipData | null;
}

export interface MentorshipData {
  profile: (Omit<MentorProfile, 'accountId'> & { activeMentees: number }) | null;
  requests: {
    id: string;
    stage: string;
    goals: string;
    wings: string[];
    status: MentorshipRequest['status'];
    createdAt: string;
    adminNote?: string;
    mentor?: { name: string; headline: string; email: string; mobile?: string; linkedinUrl?: string };
  }[];
  mentees: { id: string; name: string; email: string; mobile?: string; stage: string; goals: string; matchedAt?: string; status: MentorshipRequest['status'] }[];
  mentors: { id: string; name: string; headline: string; expertise: string[]; wings: string[]; modes: string[]; city?: string; spotsLeft: number; self: boolean }[];
}

function mentorshipData(account: MemberAccount): MentorshipData {
  const data = readPrivate();
  const mine = data.mentors.find((m) => m.accountId === account.id);
  const byId = new Map(data.mentors.map((m) => [m.id, m]));
  let profile: MentorshipData['profile'] = null;
  if (mine) {
    const { accountId: _accountId, ...rest } = mine;
    profile = { ...rest, activeMentees: activeMenteeCount(mine.id, data.mentorshipRequests) };
  }
  return {
    profile,
    requests: data.mentorshipRequests
      .filter((r) => r.accountId === account.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => {
        const m = r.status === 'matched' && r.mentorId ? byId.get(r.mentorId) : undefined;
        return {
          id: r.id,
          stage: r.stage,
          goals: r.goals,
          wings: r.wings.map(wingName),
          status: r.status,
          createdAt: r.createdAt,
          adminNote: r.adminNote,
          mentor: m ? { name: m.name, headline: m.headline, email: m.email, mobile: m.mobile, linkedinUrl: m.linkedinUrl } : undefined,
        };
      }),
    mentees: mine
      ? data.mentorshipRequests
          .filter((r) => r.mentorId === mine.id && (r.status === 'matched' || r.status === 'closed'))
          .map((r) => ({ id: r.id, name: r.name, email: r.email, mobile: r.mobile, stage: r.stage, goals: r.goals, matchedAt: r.matchedAt, status: r.status }))
      : [],
    mentors: approvedMentors().map((m) => ({
      id: m.id,
      name: m.name,
      headline: m.headline,
      expertise: m.expertise,
      wings: m.wings.map(wingName),
      modes: m.modes,
      city: m.city,
      spotsLeft: Math.max(0, m.capacity - m.activeMentees),
      self: m.accountId === account.id,
    })),
  };
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
          state: membershipState(app),
          appliedAt: app.createdAt,
          validUntil: app.validUntil,
          fee: feeFor(app),
          canPayOnline: !!razorpayConfig(),
          payments: (app.payments ?? [])
            .map((p) => ({
              id: p.id,
              amount: p.amount,
              paidAt: p.paidAt,
              validUntil: p.validUntil,
              method: p.method === 'razorpay' ? 'Online' : 'Offline',
              receiptUrl: `/api/membership/receipt/${encodeURIComponent(p.id)}`,
            }))
            .reverse(),
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
    siteName: getSettings().siteName,
    mentorship: isMember ? mentorshipData(account) : null,
    mailEnabled: mailConfigured(),
  };
}
