/**
 * Server-only search helpers for the support assistant.
 * Everything here reads the live site content (community store + legal docs) — nothing is made up.
 */
import type { CommunityEvent, CommunityNews, CommunityResource, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { MEMBERSHIP_PLANS, membershipFeeFor } from '@ascend/shared';
import { getItems, getSettings } from '../community-store';
import { canRegister, eventCategory, formatEventDate, isUpcoming, locationLabel, priceLabel, seatsLeft, sortByDate } from '../events';
import { LEGAL_DOCS } from '../../components/content/legal-docs';

export interface LinkCard {
  title: string;
  href: string;
  description?: string;
}

export interface EventCard {
  title: string;
  href: string;
  registerHref?: string;
  date: string;
  time: string;
  location: string;
  mode: string;
  category: string;
  fee: string;
  seatsLeft: number;
  status: 'open' | 'closed';
}

/** The site's own pages — the assistant links to these instead of guessing URLs. */
export const SITE_PAGES: (LinkCard & { keywords: string })[] = [
  { title: 'Home', href: '/', description: 'Overview, launch countdown and highlights', keywords: 'home start overview launch countdown' },
  { title: 'About Us', href: '/about', description: 'Vision, mission, leadership and the ten wings', keywords: 'about vision mission leadership team founders organisation structure' },
  { title: 'Events', href: '/events', description: 'All upcoming and past events with filters', keywords: 'events calendar summit masterclass workshop seminar webinar meetup register' },
  { title: 'Wings', href: '/wings', description: 'The ten wings and what each one does', keywords: 'wings verticals groups tax audit technology wellness' },
  { title: 'Speakers', href: '/speakers', description: 'Speakers at ASCEND events', keywords: 'speakers experts faculty' },
  { title: 'Resources', href: '/resources', description: 'Guides, tax updates, webinars and downloads', keywords: 'resources knowledge library guides pdf downloads tax updates webinars videos' },
  { title: 'News & Updates', href: '/news', description: 'Announcements and community updates', keywords: 'news updates announcements' },
  { title: 'Gallery', href: '/gallery', description: 'Photos and videos from events', keywords: 'gallery photos videos pictures' },
  { title: 'Join Us — Membership', href: '/join', description: 'Membership plans and the application form', keywords: 'join membership member plans pricing fee apply application core associate student' },
  { title: 'Contact', href: '/contact', description: 'Email, phone, address and the contact form', keywords: 'contact email phone address call help support form' },
  { title: 'Member login', href: '/login', description: 'Log in to your member dashboard', keywords: 'login sign in account dashboard otp' },
  { title: 'Search', href: '/search', description: 'Search the whole site', keywords: 'search find' },
  ...LEGAL_DOCS.map((d) => ({
    title: d.title,
    href: `/legal/${d.slug}`,
    keywords: `${d.title} policy legal ${d.slug.replace('-', ' ')} ${d.slug === 'refund' ? 'cancel cancellation refund money back' : ''}${d.slug === 'payment' ? 'payment razorpay upi card' : ''}`.toLowerCase(),
  })),
];

const STOPWORDS = new Set(
  'a an the is are was were be to of in on at for and or with by from about who what where when which how do does can i me my we you your it this that there any some show tell find need want please hai kya ka ki ke ko me mein se aur bhi hain ho kaise kahan kab'.split(' ')
);

const words = (q: string) =>
  q
    .toLowerCase()
    .split(/[^a-z0-9₹]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));

/** A section boost only counts when the item itself matched something. */
const withBoost = (s: number, b: number) => (s > 0 ? s + b : 0);

function score(haystack: string, query: string): number {
  const h = haystack.toLowerCase();
  return words(query).reduce((n, w) => n + (h.includes(w) ? (w.length > 3 ? 2 : 1) : 0), 0);
}

export function toEventCard(e: CommunityEvent): EventCard {
  const open = canRegister(e);
  return {
    title: e.title,
    href: `/events/${e.slug}`,
    registerHref: open ? `/events/${e.slug}/register` : undefined,
    date: formatEventDate(e, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: e.time,
    location: locationLabel(e),
    mode: e.mode,
    category: eventCategory(e),
    fee: priceLabel(e.fee),
    seatsLeft: seatsLeft(e),
    status: open ? 'open' : 'closed',
  };
}

export interface EventQuery {
  query?: string;
  city?: string;
  mode?: 'Online' | 'Offline';
  maxFee?: number;
  /** Only events with a fee. */
  paid?: boolean;
  /** Exact event category, e.g. "Workshop". */
  category?: string;
  month?: string; // YYYY-MM
  includePast?: boolean;
  /** Only past events. */
  pastOnly?: boolean;
  limit?: number;
}

export function searchEvents(q: EventQuery): EventCard[] {
  let events = getItems<CommunityEvent>('events', true);
  if (q.pastOnly) events = events.filter((e) => !isUpcoming(e));
  else if (!q.includePast) events = events.filter((e) => isUpcoming(e));
  if (q.paid) events = events.filter((e) => (Number(e.fee) || 0) > 0);
  if (q.category) events = events.filter((e) => e.category.toLowerCase() === q.category!.toLowerCase());
  if (q.city) events = events.filter((e) => e.city?.toLowerCase().includes(q.city!.toLowerCase()));
  if (q.mode) events = events.filter((e) => e.mode === q.mode);
  if (typeof q.maxFee === 'number') events = events.filter((e) => (Number(e.fee) || 0) <= q.maxFee!);
  if (q.month) events = events.filter((e) => e.date.startsWith(q.month!));
  const sorted = sortByDate(events);
  if (q.query?.trim()) {
    const speakers = getItems<CommunitySpeaker>('speakers', true);
    const ranked = sorted
      .map((e) => {
        const names = speakers.filter((s) => e.speakerSlugs?.includes(s.slug)).map((s) => s.name).join(' ');
        return { e, s: score(`${e.title} ${e.category} ${e.city} ${e.venue ?? ''} ${e.description ?? ''} ${names}`, q.query!) };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return ranked.slice(0, q.limit ?? 6).map((x) => toEventCard(x.e));
  }
  return (q.pastOnly ? sorted.reverse() : sorted).slice(0, q.limit ?? 6).map(toEventCard);
}

/** Pages, resources, news, speakers and wings matching the query, each with a direct link. */
export function searchSite(query: string): LinkCard[] {
  const q = query.toLowerCase();
  // Boost the section the visitor names ("speakers on audit" → speaker profiles first).
  const boost = (kind: 'speaker' | 'news' | 'resource' | 'wing') =>
    ({ speaker: /speaker|faculty|expert/, news: /news|update|announce/, resource: /resource|guide|pdf|download|webinar|video/, wing: /wing/ })[kind].test(q) ? 4 : 0;
  const out: (LinkCard & { s: number; kind?: string })[] = [];
  for (const p of SITE_PAGES) out.push({ title: p.title, href: p.href, description: p.description, s: score(`${p.title} ${p.keywords}`, query) + 1 });
  for (const r of getItems<CommunityResource>('resources', true))
    out.push({ title: r.title, href: '/resources', description: `${r.category} · ${r.format}${r.isMembersOnly ? ' · members only' : ''}`, s: withBoost(score(`${r.title} ${r.category} ${r.format}`, query), boost('resource')) });
  for (const n of getItems<CommunityNews>('news', true))
    out.push({ title: n.title, href: `/news/${n.slug}`, description: n.summary, s: withBoost(score(`${n.title} ${n.category} ${n.summary}`, query), boost('news')) });
  for (const s of getItems<CommunitySpeaker>('speakers', true))
    out.push({ title: s.name, href: `/speakers/${s.slug}`, description: s.title, s: withBoost(score(`${s.name} ${s.title} ${s.expertise.join(' ')} ${s.organisation ?? ''}`, query), boost('speaker')) });
  for (const w of getItems<CommunityWing>('wings', true))
    out.push({ title: w.name, href: '/wings', description: w.tags, kind: 'wing', s: withBoost(score(`${w.name} ${w.tags} ${w.activities.join(' ')}`, query), boost('wing')) });
  let wings = 0;
  return out
    .filter((x) => x.s > 1)
    .sort((a, b) => b.s - a.s)
    .filter((x) => x.kind !== 'wing' || ++wings <= 2)
    .slice(0, 6)
    .map(({ s: _s, kind: _k, ...card }) => card);
}

/** Stable facts for the system prompt (contact details and plans come from the site settings / constants). */
export function siteFacts(): string {
  const st = getSettings();
  const plans = MEMBERSHIP_PLANS.map(
    (p) => `- ${p.name} (${p.audience}): ₹${membershipFeeFor(p.key, st).toLocaleString('en-IN')} / ${p.period}`
  ).join('\n');
  return [
    `Organisation: ${st.siteName}.`,
    `Contact: email ${st.contact.email ?? 'not published'}; phone ${st.contact.phone ?? 'not published'}; address ${st.contact.address ?? 'not published'}.`,
    `Membership plans (annual fee, paid after the application is approved; valid 12 months from payment):\n${plans}`,
  ].join('\n');
}
