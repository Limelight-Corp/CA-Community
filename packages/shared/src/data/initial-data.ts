import {
  PROTOTYPE_EVENTS,
  PROTOTYPE_WINGS,
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_NEWS,
  PROTOTYPE_RESOURCES,
} from '../constants/prototype-data';
import { ORG_POSITIONING, ORG_WINGS } from '../constants/organisation';

/** One of the event categories managed in admin (defaults: EVENT_CATEGORIES). */
export type CommunityEventCategory = string;

export interface CommunityAgendaItem {
  time: string;
  title: string;
  speaker?: string;
}

export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  wingNumber: number;
  category: CommunityEventCategory;
  date: string;
  time: string;
  /** CPE / learning hours shown on the certificate (optional, set by the organiser). */
  cpeHours?: number;
  endTime?: string;
  venue: string;
  city: string;
  mode: 'Online' | 'Offline';
  /** Google Maps link for offline events. */
  mapUrl?: string;
  fee: number;
  memberFee: number;
  seatsTotal: number;
  seatsTaken: number;
  speakerSlugs: string[];
  description: string;
  agenda?: CommunityAgendaItem[];
  terms?: string;
  imageUrl?: string;
  /** Registrations accepted when true or unset. */
  registrationOpen?: boolean;
  /** Set when the organisers cancel the event (registrations close, attendees are emailed). */
  cancelledAt?: string;
  /** Optional note from the organisers shown on the event page and in the email. */
  cancellationNote?: string;
  featured?: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityGalleryItem {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  accentGradient: string;
  imageUrl?: string;
  videoUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunitySpeaker {
  id: string;
  slug: string;
  name: string;
  /** Designation, e.g. "Partner, International Tax". */
  title: string;
  qualification?: string;
  organisation?: string;
  bio: string;
  expertise: string[];
  avatarUrl?: string;
  linkedinUrl?: string;
  /** One-line introduction shown under the name. */
  headline?: string;
  /** Point-wise highlights / achievements. */
  highlights?: string[];
  /** Number-wise stats, e.g. { value: "15+", label: "Years in practice" }. */
  stats?: { value: string; label: string }[];
  /** Talks / session topics they speak on. */
  talks?: string[];
  /** Signature quote. */
  quote?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityWing {
  id: string;
  number: number;
  name: string;
  color: string;
  tags: string;
  activities: string[];
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityNews {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author?: string;
  summary: string;
  content: string;
  coverImageUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityResource {
  id: string;
  title: string;
  /** Wing name (ORG_WINGS) when the resource belongs to a wing. */
  wing?: string;
  category: string;
  format: string;
  isMembersOnly: boolean;
  downloads: number;
  fileUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityTeamMember {
  id: string;
  name: string;
  designation: string;
  group: 'Leadership' | 'Core Team' | 'Advisory Board' | 'Wing Conveners';
  /** Wing name (ORG_WINGS) for conveners and wing committee members. */
  wing?: string;
  background?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  order: number;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityTestimonial {
  id: string;
  name: string;
  designation?: string;
  quote: string;
  photoUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface CommunityInitiative {
  id: string;
  title: string;
  description: string;
  tag?: string;
  date?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imageUrl?: string;
  isPublished: boolean;
  createdAt?: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroHeadlineAccent: string;
  heroIntro: string;
  /** Optional background photo behind the homepage hero (darkened automatically). */
  heroImageUrl?: string;
  /** Optional strip shown above the header (e.g. founding member registration). */
  announcement?: string;
  /** Annual membership fees (₹) that override the Blueprint defaults in MEMBERSHIP_PLANS. */
  membershipFees?: { core?: number; associate?: number; student?: number };
  /** Admin-managed category lists (see constants/taxonomy.ts); missing keys use the defaults. */
  taxonomies?: Partial<Record<'eventCategories' | 'newsCategories' | 'resourceCategories' | 'galleryCategories' | 'jobTypes', string[]>>;
  contact: {
    email?: string;
    phone?: string;
    address?: string;
    mapUrl?: string;
  };
  social: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    x?: string;
  };
}

export interface CommunityStoreData {
  events: CommunityEvent[];
  gallery: CommunityGalleryItem[];
  speakers: CommunitySpeaker[];
  wings: CommunityWing[];
  news: CommunityNews[];
  resources: CommunityResource[];
  team: CommunityTeamMember[];
  testimonials: CommunityTestimonial[];
  initiatives: CommunityInitiative[];
  jobs: CommunityJob[];
  settings: SiteSettings;
}

/** Job / articleship opening posted by the admin (Phase 2 job board). */
export interface CommunityJob {
  id: string;
  slug: string;
  title: string;
  /** Firm or company offering the role. */
  organisation: string;
  /** One of JOB_TYPES (e.g. Articleship). */
  type: string;
  location: string;
  /** One of WORK_MODES. */
  workMode: string;
  /** e.g. "CA Inter cleared" or "0–2 years". */
  experience?: string;
  /** Stipend / salary as shown, e.g. "₹15,000 per month". */
  compensation?: string;
  description: string;
  requirements?: string[];
  applyUrl?: string;
  applyEmail?: string;
  /** Last date to apply (YYYY-MM-DD); the post hides after it. */
  deadline?: string;
  /** Wing name (ORG_WINGS) when the opening belongs to a wing's domain. */
  wing?: string;
  logoUrl?: string;
  /** How to apply is shown to active members only. */
  isMembersOnly: boolean;
  featured?: boolean;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Editable list collections of the content store. */
export type CommunityContentType =
  | 'events'
  | 'gallery'
  | 'speakers'
  | 'wings'
  | 'news'
  | 'resources'
  | 'team'
  | 'testimonials'
  | 'initiatives'
  | 'jobs';

export const COMMUNITY_CONTENT_TYPES: readonly CommunityContentType[] = [
  'events',
  'gallery',
  'speakers',
  'wings',
  'news',
  'resources',
  'team',
  'testimonials',
  'initiatives',
  'jobs',
];

// ---------------------------------------------------------------------------------------------
// Private submissions (registrations, membership applications, contact messages).
// Stored separately from content and never served by public content endpoints.
// ---------------------------------------------------------------------------------------------

export type RegistrationStatus = 'confirmed' | 'pending_payment' | 'cancelled';
export type PaymentState = 'not_required' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface CommunityRegistration {
  id: string;
  bookingId: string;
  /** Random secret that lets the registrant open their confirmation/receipt page. */
  accessToken: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  name: string;
  membershipNo?: string;
  email: string;
  mobile: string;
  city: string;
  organisation?: string;
  designation?: string;
  requirements?: string;
  fee: number;
  status: RegistrationStatus;
  paymentStatus: PaymentState;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paidAt?: string;
  /** Razorpay refund ID when refunded through the gateway. */
  refundId?: string;
  refundedAt?: string;
  /** Refunded amount in rupees (defaults to the full fee). */
  refundAmount?: number;
  attended?: boolean;
  /** First check-in time (ISO). */
  attendedAt?: string;
  /** Issued at check-in; used for the certificate PDF and /verify/<id>. */
  certificateId?: string;
  /** Random code in the ticket QR (separate from accessToken, so a QR photo can't open the booking). */
  checkinCode?: string;
  /** When the event reminder email was sent (cleared when the event is rescheduled). */
  reminderSentAt?: string;
  /** The registrant opted in to booking updates on WhatsApp. */
  whatsappOptIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMemberApplication {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  plan: 'core' | 'associate' | 'student';
  membershipNo?: string;
  qualificationYear?: string;
  areaOfPractice?: string;
  organisation?: string;
  linkedinUrl?: string;
  photoUrl?: string;
  interests?: number[];
  status: 'pending' | 'approved' | 'rejected';
  /** Fee (₹) fixed at approval; updated to the amount of each payment order that is opened. */
  membershipFee?: number;
  /** Open Razorpay order for the next payment. */
  gatewayOrderId?: string;
  /** Membership is active until this moment (ISO); extended by each payment. */
  validUntil?: string;
  payments?: MembershipPayment[];
  /** The `validUntil` a renewal reminder was already sent for. */
  renewalReminderFor?: string;
  createdAt: string;
  updatedAt: string;
}

/** One membership payment (online via Razorpay or recorded offline by the admin). */
export interface MembershipPayment {
  /** Receipt number, e.g. MEM-7K2Q9X. */
  id: string;
  amount: number;
  method: 'razorpay' | 'offline';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paidAt: string;
  validFrom: string;
  validUntil: string;
  /** Who recorded an offline payment. */
  recordedBy?: string;
}

export interface CommunityContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  createdAt: string;
}

export interface PrivateStoreData {
  registrations: CommunityRegistration[];
  members: CommunityMemberApplication[];
  messages: CommunityContactMessage[];
  mentors: MentorProfile[];
  mentorshipRequests: MentorshipRequest[];
}

// ---------------------------------------------------------------------------------------------
// Mentorship programme (Phase 2) — Mentor Match / MentorHer / Teach & Mentor formats
// ---------------------------------------------------------------------------------------------

export type MentorStatus = 'pending' | 'approved' | 'paused' | 'rejected';

export interface MentorProfile {
  id: string;
  /** Member account (verified email) that owns this profile. */
  accountId: string;
  name: string;
  email: string;
  mobile?: string;
  /** e.g. "Partner, Garg & Co · 12 years in direct tax" */
  headline: string;
  expertise: string[];
  /** Wing numbers (ORG_WINGS). */
  wings: number[];
  /** How they mentor. */
  modes: ('Online' | 'In person')[];
  city?: string;
  /** Maximum mentees at a time (1–5). */
  capacity: number;
  bio: string;
  linkedinUrl?: string;
  status: MentorStatus;
  createdAt: string;
  updatedAt: string;
}

export type MentorshipStage = 'CA student' | 'Newly qualified CA' | 'Practising CA' | 'Industry professional' | 'Other';
export const MENTORSHIP_STAGES: readonly MentorshipStage[] = ['CA student', 'Newly qualified CA', 'Practising CA', 'Industry professional', 'Other'];

export type MentorshipRequestStatus = 'open' | 'matched' | 'closed' | 'declined';

export interface MentorshipRequest {
  id: string;
  accountId: string;
  name: string;
  email: string;
  mobile?: string;
  stage: MentorshipStage;
  goals: string;
  /** Wing numbers of interest. */
  wings: number[];
  preferredMentorId?: string;
  status: MentorshipRequestStatus;
  mentorId?: string;
  matchedAt?: string;
  /** Note from the team (e.g. why a request was declined). */
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_PRIVATE_DATA: PrivateStoreData = {
  mentors: [],
  mentorshipRequests: [],
  registrations: [],
  members: [],
  messages: [],
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'ASCEND',
  tagline: `${ORG_POSITIONING.title} ${ORG_POSITIONING.titleAccent}`,
  heroEyebrow: 'Pan-India CA Community · Launching 1 January 2027',
  heroHeadline: 'Where young CAs',
  heroHeadlineAccent: 'rise together.',
  heroIntro: `${ORG_POSITIONING.summary} — ${ORG_POSITIONING.pillarsLine}`,
  announcement: 'Founding member registrations are open ahead of the 1 January 2027 launch.',
  contact: {
    email: 'hello@ascend-ca.in',
  },
  social: {},
};

const now = () => new Date().toISOString();

/** Seed content from the Blueprint: leadership named there and the 90-day launch plan. */
export const SEED_TEAM: CommunityTeamMember[] = [
  { id: 'team-1', name: 'CA Sandeep Garg', designation: 'President', group: 'Leadership', order: 1, isPublished: true },
  { id: 'team-2', name: 'CA Abhinav Aggarwal', designation: 'Vice President', group: 'Leadership', order: 2, isPublished: true },
];

export const SEED_INITIATIVES: CommunityInitiative[] = [
  {
    id: 'ini-1',
    title: 'Founding Member Registration',
    description: 'Founding member registration opens, with wing leaders, Young CA leads, Women CA leads and city leads onboarded.',
    tag: 'November 2026',
    ctaLabel: 'Join the community',
    ctaUrl: '/join',
    isPublished: true,
  },
  {
    id: 'ini-2',
    title: '10 Wings Operational',
    description: 'Ten professional wings, each with a convener and committee, running year-round formats and an annual summit.',
    tag: 'Launch readiness',
    ctaLabel: 'Explore the wings',
    ctaUrl: '/about#wings',
    isPublished: true,
  },
  {
    id: 'ini-3',
    title: 'Q1 2027 Event Calendar',
    description: 'The January–March 2027 event calendar locked, with speakers and venues confirmed.',
    tag: 'December 2026',
    ctaLabel: 'Explore events',
    ctaUrl: '/events',
    isPublished: true,
  },
  {
    id: 'ini-4',
    title: 'Community Launch',
    description: 'A new beginning for a stronger community — Pan-India launch on 1 January 2027.',
    tag: '1 January 2027',
    ctaLabel: 'Register for an event',
    ctaUrl: '/events',
    isPublished: true,
  },
];

export const INITIAL_COMMUNITY_DATA: CommunityStoreData = {
  events: PROTOTYPE_EVENTS.map((e, idx) => ({
    id: `evt-${idx + 1}`,
    ...e,
    category: e.category as CommunityEvent['category'],
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  gallery: [
    {
      id: 'gal-1',
      title: 'National Tax Summit Opening Plenary',
      category: 'Conferences',
      date: 'January 2027',
      location: 'Bharat Mandapam, New Delhi',
      accentGradient: 'from-[#0C1A58] via-[#10298A] to-[#04081E]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-2',
      title: 'Young CA Speed Networking Lounge',
      category: 'Social',
      date: 'December 2026',
      location: 'Koramangala, Bengaluru',
      accentGradient: 'from-[#2B0E4D] via-[#481E7F] to-[#0D0517]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-3',
      title: 'AI Audit Lab Hands-on Coding Session',
      category: 'Masterclasses',
      date: 'November 2026',
      location: 'Gurugram Tech Center',
      accentGradient: 'from-[#0A3D36] via-[#12665C] to-[#031512]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-4',
      title: 'CA Premier Cricket League Finals',
      category: 'Sports',
      date: 'February 2027',
      location: 'Gymkhana Grounds, Mumbai',
      accentGradient: 'from-[#14307A] via-[#1D49BB] to-[#081333]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-5',
      title: 'Women Who Lead Executive Circle',
      category: 'Social',
      date: 'November 2026',
      location: 'Taj Lands End, Mumbai',
      accentGradient: 'from-[#4D0D40] via-[#7B1968] to-[#140210]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'gal-6',
      title: 'GST Appellate Clinic & Case Discussion',
      category: 'Masterclasses',
      date: 'October 2026',
      location: 'The Orchid, Pune',
      accentGradient: 'from-[#502208] via-[#853C12] to-[#170902]',
      isPublished: true,
      createdAt: new Date().toISOString(),
    },
  ],

  speakers: Object.values(PROTOTYPE_SPEAKERS).map((s, idx) => ({
    id: `spk-${idx + 1}`,
    ...s,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  wings: PROTOTYPE_WINGS.map((w) => {
    const verified = ORG_WINGS.find((o) => o.number === w.number);
    return {
      id: `wing-${w.number}`,
      ...w,
      ...(verified && {
        name: verified.name,
        tags: verified.focus.join(' · '),
        activities: verified.activities,
      }),
      isPublished: true,
      createdAt: new Date().toISOString(),
    };
  }),

  news: PROTOTYPE_NEWS.map((n, idx) => ({
    id: `news-${idx + 1}`,
    slug: n.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    ...n,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  resources: PROTOTYPE_RESOURCES.map((r, idx) => ({
    id: `res-${idx + 1}`,
    ...r,
    downloads: 140 + idx * 87,
    isMembersOnly: idx > 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
  })),

  team: SEED_TEAM.map((t) => ({ ...t, createdAt: now() })),
  testimonials: [],
  initiatives: SEED_INITIATIVES.map((i) => ({ ...i, createdAt: now() })),
  jobs: [],
  settings: DEFAULT_SITE_SETTINGS,
};
