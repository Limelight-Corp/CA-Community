/**
 * PostgreSQL data layer shared by the web and admin apps (server only).
 *
 * Every function returns the same shapes the apps used with the JSON stores (CommunityEvent,
 * CommunityRegistration, …, see @ascend/shared), so callers only need `await`. Rows are mapped
 * in both directions here — the rest of the code never sees database column names or enums.
 */
import crypto from 'crypto';
import {
  DEFAULT_SITE_SETTINGS,
  TAXONOMY_KEYS,
  type CommunityContactMessage,
  type CommunityContentType,
  type CommunityEvent,
  type CommunityGalleryItem,
  type CommunityInitiative,
  type CommunityJob,
  type CommunityMemberApplication,
  type CommunityNews,
  type CommunityRegistration,
  type CommunityResource,
  type CommunitySpeaker,
  type CommunityStoreData,
  type CommunityTeamMember,
  type CommunityTestimonial,
  type CommunityWing,
  type MembershipPayment,
  type MentorProfile,
  type MentorshipRequest,
  type MentorshipStage,
  type PrivateStoreData,
  type SiteSettings,
  type TaxonomyKey,
} from '@ascend/shared';
import { Prisma, type PrismaClient } from '../generated/client';
import { prisma } from './index';

type Tx = Prisma.TransactionClient | PrismaClient;
type Dec = Prisma.Decimal | number | null | undefined;

const num = (v: Dec) => (v === null || v === undefined ? 0 : Number(v));
const numOpt = (v: Dec) => (v === null || v === undefined ? undefined : Number(v));
const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const iso = (d: Date) => d.toISOString();
const isoOpt = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);
const day = (d: Date) => d.toISOString().slice(0, 10);
const dayOpt = (d: Date | null | undefined) => (d ? day(d) : undefined);
/** '' / undefined → null for nullable columns; undefined stays undefined (= leave unchanged). */
const nul = <T>(v: T | '' | null | undefined): T | null | undefined => (v === undefined ? undefined : v === '' || v === null ? null : v);
const toDate = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);
const toDay = (v: string | null | undefined) => {
  if (v === undefined) return undefined;
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : new Date(d.toISOString().slice(0, 10));
};
const lower = <T extends string>(v: string) => v.toLowerCase() as T;
const upper = (v: string) => v.toUpperCase().replace(/[\s-]+/g, '_');
export const slugify = (s: string) => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// =============================================================================================
// Booking token encryption (AES-256-GCM). Key: BOOKING_TOKEN_KEY (64 hex chars), website only.
// =============================================================================================

function tokenKey(): Buffer | null {
  const raw = process.env.BOOKING_TOKEN_KEY?.trim();
  if (!raw || !/^[0-9a-f]{64}$/i.test(raw)) return null;
  return Buffer.from(raw, 'hex');
}
export const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

export function sealToken(plain: string): string | null {
  const key = tokenKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return `v1.${iv.toString('base64url')}.${body.toString('base64url')}.${c.getAuthTag().toString('base64url')}`;
}

export function openToken(sealed: string | null | undefined): string | undefined {
  const key = tokenKey();
  if (!sealed || !key) return undefined;
  const [v, iv, body, tag] = sealed.split('.');
  if (v !== 'v1' || !iv || !body || !tag) return undefined;
  try {
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([d.update(Buffer.from(body, 'base64url')), d.final()]).toString('utf8');
  } catch {
    return undefined;
  }
}

// =============================================================================================
// Settings & taxonomies
// =============================================================================================

const KIND: Record<TaxonomyKey, Prisma.TaxonomyTermCreateInput['kind']> = {
  eventCategories: 'EVENT_CATEGORY',
  newsCategories: 'NEWS_CATEGORY',
  resourceCategories: 'RESOURCE_CATEGORY',
  galleryCategories: 'GALLERY_CATEGORY',
  jobTypes: 'JOB_TYPE',
};

export async function getSettings(db: Tx = prisma): Promise<SiteSettings> {
  const [s, terms] = await Promise.all([
    db.siteSettings.findUnique({ where: { id: 1 } }),
    db.taxonomyTerm.findMany({ orderBy: [{ kind: 'asc' }, { sortOrder: 'asc' }] }),
  ]);
  const taxonomies: SiteSettings['taxonomies'] = {};
  for (const key of TAXONOMY_KEYS) {
    const values = terms.filter((t) => t.kind === KIND[key]).map((t) => t.value);
    if (values.length) taxonomies[key] = values;
  }
  if (!s) return { ...DEFAULT_SITE_SETTINGS, taxonomies };
  const fees = { core: numOpt(s.feeCore), associate: numOpt(s.feeAssociate), student: numOpt(s.feeStudent) };
  return {
    siteName: s.siteName,
    tagline: s.tagline,
    heroEyebrow: s.heroEyebrow,
    heroHeadline: s.heroHeadline,
    heroHeadlineAccent: s.heroHeadlineAccent,
    heroIntro: s.heroIntro,
    heroImageUrl: opt(s.heroImageUrl),
    announcement: opt(s.announcement),
    membershipFees: Object.values(fees).some((v) => v !== undefined) ? fees : undefined,
    taxonomies,
    contact: { email: opt(s.contactEmail), phone: opt(s.contactPhone), address: opt(s.contactAddress), mapUrl: opt(s.contactMapUrl) },
    social: { linkedin: opt(s.socialLinkedin), instagram: opt(s.socialInstagram), facebook: opt(s.socialFacebook), youtube: opt(s.socialYoutube), x: opt(s.socialX) },
  };
}

/** Same merge rules as the JSON store: top-level fields replace, contact/social merge. */
export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  const c = updates.contact, so = updates.social, f = updates.membershipFees;
  const data: Prisma.SiteSettingsUncheckedUpdateInput = {
    siteName: updates.siteName,
    tagline: updates.tagline,
    heroEyebrow: updates.heroEyebrow,
    heroHeadline: updates.heroHeadline,
    heroHeadlineAccent: updates.heroHeadlineAccent,
    heroIntro: updates.heroIntro,
    heroImageUrl: nul(updates.heroImageUrl),
    announcement: nul(updates.announcement),
    ...(f ? { feeCore: f.core ?? null, feeAssociate: f.associate ?? null, feeStudent: f.student ?? null } : {}),
    ...(c ? { contactEmail: nul(c.email), contactPhone: nul(c.phone), contactAddress: nul(c.address), contactMapUrl: nul(c.mapUrl) } : {}),
    ...(so ? { socialLinkedin: nul(so.linkedin), socialInstagram: nul(so.instagram), socialFacebook: nul(so.facebook), socialYoutube: nul(so.youtube), socialX: nul(so.x) } : {}),
  };
  const current = await getSettings();
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: {
      id: 1,
      siteName: updates.siteName ?? current.siteName,
      tagline: updates.tagline ?? current.tagline,
      heroEyebrow: updates.heroEyebrow ?? current.heroEyebrow,
      heroHeadline: updates.heroHeadline ?? current.heroHeadline,
      heroHeadlineAccent: updates.heroHeadlineAccent ?? current.heroHeadlineAccent,
      heroIntro: updates.heroIntro ?? current.heroIntro,
    },
  });
  return getSettings();
}

/** Replaces a managed list; renames (old → new) are applied to the content that uses them. */
export async function setTaxonomy(key: TaxonomyKey, values: string[], renames: Record<string, string> = {}): Promise<number> {
  const target = { eventCategories: 'event', newsCategories: 'newsArticle', resourceCategories: 'resource', galleryCategories: 'galleryItem', jobTypes: 'job' }[key];
  const field = key === 'jobTypes' ? 'type' : 'category';
  return prisma.$transaction(async (tx) => {
    await tx.taxonomyTerm.deleteMany({ where: { kind: KIND[key] } });
    await tx.taxonomyTerm.createMany({ data: values.map((value, i) => ({ kind: KIND[key], value, sortOrder: i })) });
    let moved = 0;
    for (const [from, to] of Object.entries(renames)) {
      if (from === to) continue;
      const r = await (tx as unknown as Record<string, { updateMany: (a: unknown) => Promise<{ count: number }> }>)[target]!.updateMany({
        where: { [field]: from },
        data: { [field]: to },
      });
      moved += r.count;
    }
    return moved;
  });
}

export async function resetTaxonomy(key: TaxonomyKey): Promise<void> {
  await prisma.taxonomyTerm.deleteMany({ where: { kind: KIND[key] } });
}

/** How many items use each value of a managed list (admin Categories page). */
export async function taxonomyUsage(key: TaxonomyKey): Promise<Record<string, number>> {
  const rows: { value: string; n: number }[] =
    key === 'eventCategories'
      ? await prisma.$queryRaw`SELECT category::text AS value, count(*)::int AS n FROM events GROUP BY 1`
      : key === 'newsCategories'
        ? await prisma.$queryRaw`SELECT category::text AS value, count(*)::int AS n FROM news_articles GROUP BY 1`
        : key === 'resourceCategories'
          ? await prisma.$queryRaw`SELECT category::text AS value, count(*)::int AS n FROM resources GROUP BY 1`
          : key === 'galleryCategories'
            ? await prisma.$queryRaw`SELECT category::text AS value, count(*)::int AS n FROM gallery_items GROUP BY 1`
            : await prisma.$queryRaw`SELECT type::text AS value, count(*)::int AS n FROM jobs GROUP BY 1`;
  return Object.fromEntries(rows.map((r) => [r.value, Number(r.n)]));
}

// =============================================================================================
// Content — mappers
// =============================================================================================

const eventInclude = {
  wing: { select: { number: true } },
  speakers: { orderBy: { position: 'asc' }, select: { speaker: { select: { slug: true } } } },
  agenda: { orderBy: { position: 'asc' } },
} satisfies Prisma.EventInclude;
type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>;

function toEvent(e: EventRow): CommunityEvent {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    wingNumber: e.wing.number,
    category: e.category,
    date: day(e.date),
    time: e.time,
    endTime: opt(e.endTime),
    cpeHours: numOpt(e.cpeHours),
    venue: e.venue,
    city: e.city,
    mode: e.mode === 'ONLINE' ? 'Online' : 'Offline',
    mapUrl: opt(e.mapUrl),
    fee: num(e.fee),
    memberFee: num(e.memberFee),
    seatsTotal: e.seatsTotal,
    seatsTaken: e.seatsTaken,
    speakerSlugs: e.speakers.map((s) => s.speaker.slug),
    description: e.description,
    agenda: e.agenda.map((a) => ({ time: a.time, title: a.title, speaker: opt(a.speaker) })),
    terms: opt(e.terms),
    imageUrl: opt(e.imageUrl),
    registrationOpen: e.registrationOpen,
    cancelledAt: isoOpt(e.cancelledAt),
    cancellationNote: opt(e.cancellationNote),
    featured: e.featured,
    isPublished: e.isPublished,
    createdAt: iso(e.createdAt),
    updatedAt: iso(e.updatedAt),
  };
}

const wingName = { select: { name: true } } as const;
const TEAM_GROUP: Record<string, CommunityTeamMember['group']> = {
  LEADERSHIP: 'Leadership',
  CORE_TEAM: 'Core Team',
  ADVISORY_BOARD: 'Advisory Board',
  WING_CONVENERS: 'Wing Conveners',
};
const WORK_MODE: Record<string, string> = { ON_SITE: 'On-site', HYBRID: 'Hybrid', REMOTE: 'Remote' };

type Mapped = { [K in CommunityContentType]: CommunityStoreData[K][number] };

/** Fetches one content collection in the apps' shape (newest first, like the JSON store). */
export async function listContent<K extends CommunityContentType>(type: K, publishedOnly = false, db: Tx = prisma): Promise<Mapped[K][]> {
  const where = publishedOnly ? { isPublished: true } : {};
  const newest = [{ createdAt: 'desc' as const }, { id: 'asc' as const }];
  let out: unknown[];
  switch (type) {
    case 'events':
      out = (await db.event.findMany({ where, include: eventInclude, orderBy: newest })).map(toEvent);
      break;
    case 'wings':
      out = (await db.wing.findMany({ where, orderBy: { number: 'asc' } })).map(
        (w): CommunityWing => ({ id: w.id, number: w.number, name: w.name, color: w.color, tags: w.tags, activities: w.activities, isPublished: w.isPublished, createdAt: iso(w.createdAt), updatedAt: iso(w.updatedAt) })
      );
      break;
    case 'speakers':
      out = (await db.speaker.findMany({ where, orderBy: newest })).map(
        (s): CommunitySpeaker => ({
          id: s.id, slug: s.slug, name: s.name, title: s.title, qualification: opt(s.qualification), organisation: opt(s.organisation), bio: s.bio,
          expertise: s.expertise, avatarUrl: opt(s.avatarUrl), linkedinUrl: opt(s.linkedinUrl), headline: opt(s.headline), highlights: s.highlights,
          stats: (s.stats as { value: string; label: string }[]) ?? [], talks: s.talks, quote: opt(s.quote), isPublished: s.isPublished, createdAt: iso(s.createdAt), updatedAt: iso(s.updatedAt),
        })
      );
      break;
    case 'news':
      out = (await db.newsArticle.findMany({ where, orderBy: newest })).map(
        (n): CommunityNews => ({
          id: n.id, slug: n.slug, title: n.title, category: n.category, date: n.dateLabel, author: opt(n.author), summary: n.summary, content: n.content,
          coverImageUrl: opt(n.coverImageUrl), isPublished: n.isPublished, createdAt: iso(n.createdAt), updatedAt: iso(n.updatedAt),
        })
      );
      break;
    case 'resources':
      out = (await db.resource.findMany({ where, include: { wing: wingName }, orderBy: newest })).map(
        (r): CommunityResource => ({
          id: r.id, title: r.title, wing: r.wing?.name, category: r.category, format: r.format, isMembersOnly: r.isMembersOnly, downloads: r.downloads,
          fileUrl: opt(r.fileUrl), isPublished: r.isPublished, createdAt: iso(r.createdAt), updatedAt: iso(r.updatedAt),
        })
      );
      break;
    case 'gallery':
      out = (await db.galleryItem.findMany({ where, orderBy: newest })).map(
        (g): CommunityGalleryItem => ({
          id: g.id, title: g.title, category: g.category, date: g.dateLabel, location: g.location, accentGradient: g.accentGradient, imageUrl: opt(g.imageUrl),
          videoUrl: opt(g.videoUrl), isPublished: g.isPublished, createdAt: iso(g.createdAt), updatedAt: iso(g.updatedAt),
        })
      );
      break;
    case 'team':
      out = (
        await db.teamMember.findMany({
          where,
          include: { wing: wingName, wings: { orderBy: { position: 'asc' }, select: { wing: wingName } } },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        })
      ).map(
        (t): CommunityTeamMember => ({
          id: t.id, name: t.name, designation: t.designation, group: TEAM_GROUP[t.group]!,
          // All wings (in the order chosen); `wing` is the first one, for older code.
          wings: t.wings.length ? t.wings.map((w) => w.wing.name) : t.wing ? [t.wing.name] : [],
          wing: t.wings[0]?.wing.name ?? t.wing?.name, background: opt(t.background),
          photoUrl: opt(t.photoUrl), linkedinUrl: opt(t.linkedinUrl), order: t.sortOrder, isPublished: t.isPublished, createdAt: iso(t.createdAt), updatedAt: iso(t.updatedAt),
        })
      );
      break;
    case 'testimonials':
      out = (await db.testimonial.findMany({ where, orderBy: newest })).map(
        (t): CommunityTestimonial => ({ id: t.id, name: t.name, designation: opt(t.designation), quote: t.quote, photoUrl: opt(t.photoUrl), isPublished: t.isPublished, createdAt: iso(t.createdAt), updatedAt: iso(t.updatedAt) })
      );
      break;
    case 'initiatives':
      out = (await db.initiative.findMany({ where, orderBy: newest })).map(
        (i): CommunityInitiative => ({
          id: i.id, title: i.title, description: i.description, tag: opt(i.tag), date: dayOpt(i.date), ctaLabel: opt(i.ctaLabel), ctaUrl: opt(i.ctaUrl),
          imageUrl: opt(i.imageUrl), isPublished: i.isPublished, createdAt: iso(i.createdAt), updatedAt: iso(i.updatedAt),
        })
      );
      break;
    case 'jobs':
      out = (await db.job.findMany({ where, include: { wing: wingName }, orderBy: newest })).map(
        (j): CommunityJob => ({
          id: j.id, slug: j.slug, title: j.title, organisation: j.organisation, type: j.type, location: j.location, workMode: WORK_MODE[j.workMode] ?? j.workMode,
          experience: opt(j.experience), compensation: opt(j.compensation), description: j.description, requirements: j.requirements, applyUrl: opt(j.applyUrl),
          applyEmail: opt(j.applyEmail), deadline: dayOpt(j.deadline), wing: j.wing?.name, logoUrl: opt(j.logoUrl), isMembersOnly: j.isMembersOnly,
          featured: j.featured, isPublished: j.isPublished, createdAt: iso(j.createdAt), updatedAt: iso(j.updatedAt),
        })
      );
      break;
    default:
      throw new Error(`Unknown content type: ${String(type)}`);
  }
  return out as Mapped[K][];
}

/** The whole public content store, in the JSON store's shape (admin pages, sitemap, search). */
export async function readContentStore(): Promise<CommunityStoreData> {
  const [events, gallery, speakers, wings, news, resources, team, testimonials, initiatives, jobs, settings] = await Promise.all([
    listContent('events'), listContent('gallery'), listContent('speakers'), listContent('wings'), listContent('news'), listContent('resources'),
    listContent('team'), listContent('testimonials'), listContent('initiatives'), listContent('jobs'), getSettings(),
  ]);
  return { events, gallery, speakers, wings, news, resources, team, testimonials, initiatives, jobs, settings };
}

export async function getEvent(where: { id: string } | { slug: string }, db: Tx = prisma): Promise<CommunityEvent | undefined> {
  const e = await db.event.findUnique({ where, include: eventInclude });
  return e ? toEvent(e) : undefined;
}

// =============================================================================================
// Content — writes (admin). `data` uses the apps' field names and is already validated.
// =============================================================================================

type AnyItem = Record<string, unknown>;
const has = (o: AnyItem, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const str = (o: AnyItem, k: string) => (has(o, k) ? (o[k] as string | undefined) : undefined);

async function wingIdByNumber(db: Tx, n: unknown): Promise<string | undefined> {
  if (n === undefined) return undefined;
  const w = await db.wing.findUnique({ where: { number: Number(n) }, select: { id: true } });
  if (!w) throw Object.assign(new Error('Choose a wing'), { status: 422 });
  return w.id;
}
async function wingIdByName(db: Tx, name: unknown): Promise<string | null | undefined> {
  if (name === undefined) return undefined;
  if (!name) return null;
  const w = await db.wing.findUnique({ where: { name: String(name) }, select: { id: true } });
  return w?.id ?? null;
}

async function contentData(type: CommunityContentType, d: AnyItem, db: Tx): Promise<AnyItem> {
  const pub = has(d, 'isPublished') ? { isPublished: d.isPublished !== false } : {};
  switch (type) {
    case 'events':
      return {
        slug: d.slug, title: d.title, wingId: await wingIdByNumber(db, d.wingNumber), category: d.category, date: toDay(str(d, 'date')), time: d.time,
        endTime: nul(str(d, 'endTime')), mode: d.mode === undefined ? undefined : upper(String(d.mode)), venue: d.venue, city: d.city ?? (has(d, 'city') ? '' : undefined),
        mapUrl: nul(str(d, 'mapUrl')), fee: d.fee, memberFee: d.memberFee, seatsTotal: d.seatsTotal, seatsTaken: d.seatsTaken,
        cpeHours: has(d, 'cpeHours') ? (d.cpeHours === undefined || d.cpeHours === '' ? null : d.cpeHours) : undefined, description: d.description,
        terms: nul(str(d, 'terms')), imageUrl: nul(str(d, 'imageUrl')), registrationOpen: d.registrationOpen, featured: d.featured,
        cancelledAt: has(d, 'cancelledAt') ? toDate(str(d, 'cancelledAt')) ?? null : undefined, cancellationNote: has(d, 'cancellationNote') ? nul(str(d, 'cancellationNote')) ?? null : undefined,
        ...pub,
      };
    case 'wings':
      return { number: d.number, name: d.name, slug: d.name ? slugify(String(d.name)) : undefined, color: d.color, tags: d.tags, activities: d.activities, ...pub };
    case 'speakers':
      return {
        slug: d.slug, name: d.name, title: d.title, qualification: nul(str(d, 'qualification')), organisation: nul(str(d, 'organisation')),
        headline: nul(str(d, 'headline')), bio: d.bio, expertise: d.expertise, highlights: d.highlights, talks: d.talks, stats: d.stats,
        quote: nul(str(d, 'quote')), avatarUrl: nul(str(d, 'avatarUrl')), linkedinUrl: nul(str(d, 'linkedinUrl')), ...pub,
      };
    case 'news':
      return {
        slug: d.slug, title: d.title, category: d.category, dateLabel: d.date, publishedOn: has(d, 'date') ? toDay(str(d, 'date')) ?? new Date() : undefined,
        author: nul(str(d, 'author')), summary: d.summary, content: d.content, coverImageUrl: nul(str(d, 'coverImageUrl')), ...pub,
      };
    case 'resources':
      return {
        title: d.title, category: d.category, format: d.format, wingId: await wingIdByName(db, d.wing), fileUrl: nul(str(d, 'fileUrl')),
        isMembersOnly: d.isMembersOnly, downloads: d.downloads, ...pub,
      };
    case 'gallery':
      return {
        title: d.title, category: d.category, dateLabel: d.date, location: d.location, accentGradient: d.accentGradient, imageUrl: nul(str(d, 'imageUrl')),
        videoUrl: nul(str(d, 'videoUrl')), ...pub,
      };
    case 'team':
      return {
        name: d.name, designation: d.designation, group: d.group === undefined ? undefined : upper(String(d.group)),
        // Primary wing = the first of `wings` (or the single `wing` older callers send).
        wingId: Array.isArray(d.wings) ? await wingIdByName(db, (d.wings as string[])[0] ?? '') : await wingIdByName(db, d.wing),
        background: nul(str(d, 'background')), photoUrl: nul(str(d, 'photoUrl')), linkedinUrl: nul(str(d, 'linkedinUrl')), sortOrder: d.order, ...pub,
      };
    case 'testimonials':
      return { name: d.name, designation: nul(str(d, 'designation')), quote: d.quote, photoUrl: nul(str(d, 'photoUrl')), ...pub };
    case 'initiatives':
      return {
        title: d.title, description: d.description, tag: nul(str(d, 'tag')), date: toDay(str(d, 'date')), ctaLabel: nul(str(d, 'ctaLabel')),
        ctaUrl: nul(str(d, 'ctaUrl')), imageUrl: nul(str(d, 'imageUrl')), ...pub,
      };
    case 'jobs':
      return {
        slug: d.slug, title: d.title, organisation: d.organisation, type: d.type, location: d.location,
        workMode: d.workMode === undefined ? undefined : upper(String(d.workMode)), experience: nul(str(d, 'experience')), compensation: nul(str(d, 'compensation')),
        description: d.description, requirements: d.requirements, applyUrl: nul(str(d, 'applyUrl')), applyEmail: nul(str(d, 'applyEmail')),
        deadline: toDay(str(d, 'deadline')), wingId: await wingIdByName(db, d.wing), logoUrl: nul(str(d, 'logoUrl')), isMembersOnly: d.isMembersOnly,
        featured: d.featured, ...pub,
      };
    default:
      throw new Error(`Unknown content type: ${String(type)}`);
  }
}

const MODEL: Record<CommunityContentType, string> = {
  events: 'event', wings: 'wing', speakers: 'speaker', news: 'newsArticle', resources: 'resource', gallery: 'galleryItem',
  team: 'teamMember', testimonials: 'testimonial', initiatives: 'initiative', jobs: 'job',
};
type Delegate = {
  create: (a: unknown) => Promise<{ id: string }>;
  update: (a: unknown) => Promise<{ id: string }>;
  delete: (a: unknown) => Promise<unknown>;
};
const delegate = (db: Tx, type: CommunityContentType) => (db as unknown as Record<string, Delegate>)[MODEL[type]]!;
const strip = (o: AnyItem) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

/** Replaces a team member's wings (by name, in order); also accepts the single `wing` older callers send. */
async function writeTeamWings(db: Tx, teamMemberId: string, d: AnyItem) {
  const names = Array.isArray(d.wings) ? (d.wings as string[]) : has(d, 'wing') ? [d.wing].filter(Boolean).map(String) : null;
  if (!names) return;
  await db.teamMemberWing.deleteMany({ where: { teamMemberId } });
  const wings = await db.wing.findMany({ where: { name: { in: names } }, select: { id: true, name: true } });
  const byName = new Map(wings.map((w) => [w.name, w.id]));
  const rows = [...new Set(names)].flatMap((name, position) => (byName.has(name) ? [{ teamMemberId, wingId: byName.get(name)!, position }] : []));
  if (rows.length) await db.teamMemberWing.createMany({ data: rows, skipDuplicates: true });
}

async function writeEventChildren(db: Tx, eventId: string, d: AnyItem) {
  if (Array.isArray(d.speakerSlugs)) {
    await db.eventSpeaker.deleteMany({ where: { eventId } });
    const speakers = await db.speaker.findMany({ where: { slug: { in: d.speakerSlugs as string[] } }, select: { id: true, slug: true } });
    const bySlug = new Map(speakers.map((s) => [s.slug, s.id]));
    const rows = (d.speakerSlugs as string[]).flatMap((slug, position) => (bySlug.has(slug) ? [{ eventId, speakerId: bySlug.get(slug)!, position }] : []));
    if (rows.length) await db.eventSpeaker.createMany({ data: rows, skipDuplicates: true });
  }
  if (Array.isArray(d.agenda)) {
    await db.eventAgendaItem.deleteMany({ where: { eventId } });
    const rows = (d.agenda as { time?: string; title: string; speaker?: string }[]).map((a, position) => ({
      eventId, position, time: a.time ?? '', title: a.title, speaker: a.speaker || null,
    }));
    if (rows.length) await db.eventAgendaItem.createMany({ data: rows });
  }
}

/** Creates a content item and returns it in the apps' shape. */
export async function createContent<K extends CommunityContentType>(type: K, data: AnyItem): Promise<Mapped[K]> {
  return prisma.$transaction(async (tx) => {
    const row = await delegate(tx, type).create({ data: strip({ ...(await contentData(type, data, tx)), id: data.id || undefined, isPublished: data.isPublished !== false }) });
    if (type === 'events') await writeEventChildren(tx, row.id, data);
    if (type === 'team') await writeTeamWings(tx, row.id, data);
    return (await getContent(type, row.id, tx))!;
  });
}

export async function getContent<K extends CommunityContentType>(type: K, id: string, db: Tx = prisma): Promise<Mapped[K] | undefined> {
  if (type === 'events') return (await getEvent({ id }, db)) as Mapped[K] | undefined;
  const all = await listContent(type, false, db);
  return all.find((x) => (x as { id: string }).id === id);
}

/** Partial update (same as the JSON store's updateItem); null when the item does not exist. */
export async function updateContent<K extends CommunityContentType>(type: K, id: string, data: AnyItem): Promise<Mapped[K] | null> {
  return prisma.$transaction(async (tx) => {
    try {
      await delegate(tx, type).update({ where: { id }, data: strip(await contentData(type, data, tx)) });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') return null;
      throw err;
    }
    if (type === 'events') await writeEventChildren(tx, id, data);
    if (type === 'team') await writeTeamWings(tx, id, data);
    return (await getContent(type, id, tx)) ?? null;
  });
}

export async function deleteContent(type: CommunityContentType, id: string): Promise<boolean> {
  try {
    await delegate(prisma, type).delete({ where: { id } });
    return true;
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return false;
    throw err;
  }
}

/** Atomic counters (no read-modify-write races). */
export async function addSeatTaken(eventId: string, by = 1, db: Tx = prisma): Promise<CommunityEvent | undefined> {
  await db.event.update({ where: { id: eventId }, data: { seatsTaken: { increment: by } } }).catch(() => null);
  return getEvent({ id: eventId }, db);
}
export async function addDownload(resourceId: string): Promise<void> {
  await prisma.resource.update({ where: { id: resourceId }, data: { downloads: { increment: 1 } } }).catch(() => null);
}

// =============================================================================================
// Bookings
// =============================================================================================

const regInclude = { event: { select: { slug: true } } } satisfies Prisma.EventRegistrationInclude;
type RegRow = Prisma.EventRegistrationGetPayload<{ include: typeof regInclude }>;

function toRegistration(r: RegRow): CommunityRegistration {
  return {
    id: r.id,
    bookingId: r.bookingId,
    accessToken: openToken(r.accessTokenEnc) ?? '',
    eventId: r.eventId,
    eventSlug: r.event.slug,
    eventTitle: r.eventTitle,
    name: r.name,
    membershipNo: opt(r.membershipNo),
    email: r.email,
    mobile: r.mobile,
    city: r.city,
    organisation: opt(r.organisation),
    designation: opt(r.designation),
    requirements: opt(r.requirements),
    fee: num(r.fee),
    status: lower(r.status),
    paymentStatus: lower(r.paymentStatus),
    gatewayOrderId: opt(r.gatewayOrderId),
    gatewayPaymentId: opt(r.gatewayPaymentId),
    paidAt: isoOpt(r.paidAt),
    refundId: opt(r.refundId),
    refundedAt: isoOpt(r.refundedAt),
    refundAmount: numOpt(r.refundAmount),
    attended: r.attended,
    attendedAt: isoOpt(r.attendedAt),
    certificateId: opt(r.certificateId),
    checkinCode: openToken(r.checkinCodeEnc),
    reminderSentAt: isoOpt(r.reminderSentAt),
    whatsappOptIn: r.whatsappOptIn || undefined,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

/** Maps a partial CommunityRegistration (app field names) to columns. */
function registrationData(p: Partial<CommunityRegistration>): Prisma.EventRegistrationUncheckedUpdateInput {
  return strip({
    bookingId: p.bookingId,
    accessTokenHash: p.accessToken !== undefined ? sha256(p.accessToken) : undefined,
    accessTokenEnc: p.accessToken !== undefined ? sealToken(p.accessToken) : undefined,
    checkinCodeHash: p.checkinCode !== undefined ? (p.checkinCode ? sha256(p.checkinCode) : null) : undefined,
    checkinCodeEnc: p.checkinCode !== undefined ? (p.checkinCode ? sealToken(p.checkinCode) : null) : undefined,
    eventId: p.eventId,
    eventTitle: p.eventTitle,
    name: p.name,
    membershipNo: nul(p.membershipNo),
    email: p.email,
    mobile: p.mobile,
    city: p.city,
    organisation: nul(p.organisation),
    designation: nul(p.designation),
    requirements: nul(p.requirements),
    whatsappOptIn: p.whatsappOptIn,
    fee: p.fee,
    status: p.status ? upper(p.status) : undefined,
    paymentStatus: p.paymentStatus ? upper(p.paymentStatus) : undefined,
    gatewayOrderId: nul(p.gatewayOrderId),
    gatewayPaymentId: nul(p.gatewayPaymentId),
    paidAt: toDate(p.paidAt),
    refundId: nul(p.refundId),
    refundAmount: p.refundAmount,
    refundedAt: toDate(p.refundedAt),
    attended: p.attended,
    attendedAt: toDate(p.attendedAt),
    certificateId: nul(p.certificateId),
    reminderSentAt: toDate(p.reminderSentAt),
  }) as Prisma.EventRegistrationUncheckedUpdateInput;
}

export type RegistrationKey =
  | { id: string }
  | { bookingId: string }
  | { gatewayOrderId: string }
  | { certificateId: string }
  | { checkinCode: string }
  | { accessToken: string };

function regWhere(key: RegistrationKey): Prisma.EventRegistrationWhereUniqueInput {
  if ('checkinCode' in key) return { checkinCodeHash: sha256(key.checkinCode) };
  if ('accessToken' in key) return { accessTokenHash: sha256(key.accessToken) };
  return key;
}

export async function getRegistration(key: RegistrationKey, db: Tx = prisma): Promise<CommunityRegistration | undefined> {
  const r = await db.eventRegistration.findUnique({ where: regWhere(key), include: regInclude });
  return r ? toRegistration(r) : undefined;
}

export async function listRegistrations(where: Prisma.EventRegistrationWhereInput = {}, db: Tx = prisma): Promise<CommunityRegistration[]> {
  const rows = await db.eventRegistration.findMany({ where, include: regInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  return rows.map(toRegistration);
}

/** Inserts a booking (fields in the apps' shape; the token and check-in code are hashed + sealed). */
export async function insertRegistration(reg: CommunityRegistration, db: Tx = prisma): Promise<CommunityRegistration> {
  const r = await db.eventRegistration.create({
    data: {
      ...(registrationData(reg) as Prisma.EventRegistrationUncheckedCreateInput),
      id: reg.id || undefined,
      accessTokenHash: sha256(reg.accessToken),
      createdAt: toDate(reg.createdAt) ?? undefined,
    },
    include: regInclude,
  });
  return toRegistration(r);
}

/** Partial update; undefined fields stay as they are. Returns null when not found. */
export async function updateRegistration(key: RegistrationKey, patch: Partial<CommunityRegistration>, db: Tx = prisma): Promise<CommunityRegistration | null> {
  try {
    const r = await db.eventRegistration.update({ where: regWhere(key), data: registrationData(patch), include: regInclude });
    return toRegistration(r);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return null;
    throw err;
  }
}

/** Runs `fn` in a transaction with the event row locked, so seat checks and inserts never race. */
export async function withEventLock<T>(eventId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM events WHERE id = ${eventId} FOR UPDATE`;
    return fn(tx);
  });
}

// =============================================================================================
// Memberships
// =============================================================================================

const memberInclude = {
  interests: { select: { wing: { select: { number: true } } } },
  payments: { orderBy: { paidAt: 'asc' } },
} satisfies Prisma.MembershipInclude;
type MemberRow = Prisma.MembershipGetPayload<{ include: typeof memberInclude }>;

function toPayment(p: MemberRow['payments'][number]): MembershipPayment {
  return {
    id: p.receiptId,
    amount: num(p.amount),
    method: lower(p.method),
    gatewayOrderId: opt(p.gatewayOrderId),
    gatewayPaymentId: opt(p.gatewayPaymentId),
    paidAt: iso(p.paidAt),
    validFrom: iso(p.validFrom),
    validUntil: iso(p.validUntil),
    recordedBy: opt(p.recordedById),
  };
}

function toMember(m: MemberRow): CommunityMemberApplication {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    mobile: m.mobile,
    city: m.city,
    plan: lower(m.plan),
    membershipNo: opt(m.membershipNo),
    qualificationYear: opt(m.qualificationYear),
    areaOfPractice: opt(m.areaOfPractice),
    organisation: opt(m.organisation),
    linkedinUrl: opt(m.linkedinUrl),
    photoUrl: opt(m.photoUrl),
    interests: m.interests.map((i) => i.wing.number).sort((a, b) => a - b),
    status: lower(m.status),
    membershipFee: numOpt(m.fee),
    orderAmount: numOpt(m.orderAmount),
    gatewayOrderId: opt(m.gatewayOrderId),
    validUntil: isoOpt(m.validUntil),
    payments: m.payments.map(toPayment),
    renewalReminderFor: isoOpt(m.renewalReminderFor),
    createdAt: iso(m.createdAt),
    updatedAt: iso(m.updatedAt),
  };
}

export async function listMembers(where: Prisma.MembershipWhereInput = {}, db: Tx = prisma): Promise<CommunityMemberApplication[]> {
  const rows = await db.membership.findMany({ where, include: memberInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  return rows.map(toMember);
}

export async function getMember(key: { id: string } | { email: string } | { gatewayOrderId: string }, db: Tx = prisma): Promise<CommunityMemberApplication | undefined> {
  const m = await db.membership.findUnique({ where: 'email' in key ? { email: key.email.trim().toLowerCase() } : key, include: memberInclude });
  return m ? toMember(m) : undefined;
}

async function interestRows(db: Tx, membershipId: string, numbers: number[]) {
  const wings = await db.wing.findMany({ where: { number: { in: numbers } }, select: { id: true } });
  return wings.map((w) => ({ membershipId, wingId: w.id }));
}

/** Creates an application; null when the email already applied. */
export async function createMember(app: Omit<CommunityMemberApplication, 'id'> & { id?: string }): Promise<CommunityMemberApplication | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const account = await tx.memberAccount.findUnique({ where: { email: app.email.trim().toLowerCase() }, select: { id: true } });
      const m = await tx.membership.create({
        data: {
          id: app.id || undefined,
          accountId: account?.id ?? null,
          name: app.name,
          email: app.email.trim().toLowerCase(),
          mobile: app.mobile,
          city: app.city,
          plan: upper(app.plan) as Prisma.MembershipCreateInput['plan'],
          membershipNo: nul(app.membershipNo) ?? null,
          qualificationYear: nul(app.qualificationYear) ?? null,
          areaOfPractice: nul(app.areaOfPractice) ?? null,
          organisation: nul(app.organisation) ?? null,
          linkedinUrl: nul(app.linkedinUrl) ?? null,
          photoUrl: nul(app.photoUrl) ?? null,
          status: upper(app.status) as Prisma.MembershipCreateInput['status'],
        },
      });
      const rows = await interestRows(tx, m.id, app.interests ?? []);
      if (rows.length) await tx.membershipInterest.createMany({ data: rows });
      return (await getMember({ id: m.id }, tx))!;
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') return null;
    throw err;
  }
}

/** Partial update (status, fee, term, profile fields, interests). Payments are added with addMemberPayment. */
export async function updateMember(id: string, patch: Partial<CommunityMemberApplication>, db?: Tx): Promise<CommunityMemberApplication | null> {
  const run = async (tx: Tx) => {
    try {
      await tx.membership.update({
        where: { id },
        data: strip({
          name: patch.name,
          email: patch.email?.trim().toLowerCase(),
          mobile: patch.mobile,
          city: patch.city,
          plan: patch.plan ? upper(patch.plan) : undefined,
          membershipNo: nul(patch.membershipNo),
          qualificationYear: nul(patch.qualificationYear),
          areaOfPractice: nul(patch.areaOfPractice),
          organisation: nul(patch.organisation),
          linkedinUrl: nul(patch.linkedinUrl),
          photoUrl: nul(patch.photoUrl),
          status: patch.status ? upper(patch.status) : undefined,
          fee: has(patch as AnyItem, 'membershipFee') ? (patch.membershipFee ?? null) : undefined,
          gatewayOrderId: has(patch as AnyItem, 'gatewayOrderId') ? (patch.gatewayOrderId || null) : undefined,
          validUntil: toDate(patch.validUntil),
          renewalReminderFor: has(patch as AnyItem, 'renewalReminderFor') ? (toDate(patch.renewalReminderFor) ?? null) : undefined,
        }) as Prisma.MembershipUncheckedUpdateInput,
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'P2025') return null;
      throw err;
    }
    if (patch.interests) {
      await tx.membershipInterest.deleteMany({ where: { membershipId: id } });
      const rows = await interestRows(tx, id, patch.interests);
      if (rows.length) await tx.membershipInterest.createMany({ data: rows });
    }
    return (await getMember({ id }, tx)) ?? null;
  };
  return db ? run(db) : prisma.$transaction(run);
}

/** Records a payment and the new term in one transaction (idempotent on the gateway payment id). */
export async function addMemberPayment(
  id: string,
  payment: MembershipPayment,
  term: { validUntil: string; status?: CommunityMemberApplication['status']; clearOrder?: boolean },
  db?: Tx
): Promise<CommunityMemberApplication | null> {
  const run = async (tx: Tx) => {
    if (payment.gatewayPaymentId) {
      const dup = await tx.membershipPayment.findUnique({ where: { gatewayPaymentId: payment.gatewayPaymentId } });
      if (dup) return (await getMember({ id }, tx)) ?? null;
    }
    await tx.membershipPayment.create({
      data: {
        receiptId: payment.id,
        membershipId: id,
        amount: payment.amount,
        method: upper(payment.method) as Prisma.MembershipPaymentCreateInput['method'],
        gatewayOrderId: payment.gatewayOrderId ?? null,
        gatewayPaymentId: payment.gatewayPaymentId ?? null,
        paidAt: new Date(payment.paidAt),
        validFrom: new Date(payment.validFrom),
        validUntil: new Date(payment.validUntil),
        recordedById: payment.recordedBy ?? null,
      },
    });
    await tx.membership.update({
      where: { id },
      data: strip({
        validUntil: new Date(term.validUntil),
        status: term.status ? upper(term.status) : undefined,
        gatewayOrderId: term.clearOrder ? null : undefined,
        orderAmount: term.clearOrder ? null : undefined,
      }) as Prisma.MembershipUncheckedUpdateInput,
    });
    return (await getMember({ id }, tx)) ?? null;
  };
  return db ? run(db) : prisma.$transaction(run);
}

/** Opens an online-payment order on an application (website): order id + amount, never the fee. */
export async function setMemberOrder(id: string, gatewayOrderId: string, amount: number, db: Tx = prisma): Promise<void> {
  await db.membership.update({ where: { id }, data: { gatewayOrderId, orderAmount: amount } });
}

/** Finds the application an order belongs to (open order or an already-recorded payment). */
export async function memberIdForOrder(gatewayOrderId: string, db: Tx = prisma): Promise<string | undefined> {
  const m = await db.membership.findFirst({
    where: { OR: [{ gatewayOrderId }, { payments: { some: { gatewayOrderId } } }] },
    select: { id: true },
  });
  return m?.id;
}

// =============================================================================================
// Contact messages
// =============================================================================================

function toMessage(m: Prisma.ContactMessageGetPayload<object>): CommunityContactMessage {
  return { id: m.id, name: m.name, email: m.email, phone: opt(m.phone), subject: m.subject, message: m.message, status: lower(m.status), createdAt: iso(m.createdAt) };
}
export async function listMessages(): Promise<CommunityContactMessage[]> {
  return (await prisma.contactMessage.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })).map(toMessage);
}
/**
 * Saves a contact message. Uses createMany (a plain INSERT, no RETURNING) because the website's
 * database role may write to the inbox but never read it.
 */
export async function createMessage(m: Omit<CommunityContactMessage, 'id' | 'createdAt' | 'status'> & { status?: CommunityContactMessage['status'] }): Promise<CommunityContactMessage> {
  const row = {
    id: crypto.randomUUID(),
    name: m.name,
    email: m.email.trim().toLowerCase(),
    phone: m.phone || null,
    subject: m.subject,
    message: m.message,
    status: upper(m.status ?? 'new') as 'NEW',
    createdAt: new Date(),
  };
  await prisma.contactMessage.createMany({ data: [row] });
  return toMessage({ ...row, updatedAt: row.createdAt });
}
export async function setMessageStatus(id: string, status: CommunityContactMessage['status']): Promise<CommunityContactMessage | null> {
  try {
    return toMessage(await prisma.contactMessage.update({ where: { id }, data: { status: upper(status) as 'NEW' } }));
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return null;
    throw err;
  }
}

// =============================================================================================
// Mentorship
// =============================================================================================

const STAGE_TO_DB: Record<MentorshipStage, string> = {
  'CA student': 'CA_STUDENT',
  'Newly qualified CA': 'NEWLY_QUALIFIED',
  'Practising CA': 'PRACTISING',
  'Industry professional': 'INDUSTRY',
  Other: 'OTHER',
};
const STAGE_FROM_DB = Object.fromEntries(Object.entries(STAGE_TO_DB).map(([k, v]) => [v, k])) as Record<string, MentorshipStage>;
const MODE_TO_DB: Record<string, 'ONLINE' | 'IN_PERSON'> = { Online: 'ONLINE', 'In person': 'IN_PERSON' };

const mentorInclude = {
  account: { select: { name: true, email: true, mobile: true } },
  wings: { select: { wing: { select: { number: true } } } },
} satisfies Prisma.MentorInclude;
const requestInclude = {
  account: { select: { name: true, email: true, mobile: true } },
  wings: { select: { wing: { select: { number: true } } } },
} satisfies Prisma.MentorshipRequestInclude;

function toMentor(m: Prisma.MentorGetPayload<{ include: typeof mentorInclude }>): MentorProfile {
  return {
    id: m.id,
    accountId: m.accountId,
    name: m.account.name,
    email: m.account.email,
    mobile: opt(m.account.mobile),
    headline: m.headline,
    expertise: m.expertise,
    wings: m.wings.map((w) => w.wing.number).sort((a, b) => a - b),
    modes: m.modes.map((x) => (x === 'ONLINE' ? 'Online' : 'In person')),
    city: opt(m.city),
    capacity: m.capacity,
    bio: m.bio,
    linkedinUrl: opt(m.linkedinUrl),
    status: lower(m.status),
    createdAt: iso(m.createdAt),
    updatedAt: iso(m.updatedAt),
  };
}

function toRequest(r: Prisma.MentorshipRequestGetPayload<{ include: typeof requestInclude }>): MentorshipRequest {
  return {
    id: r.id,
    accountId: r.accountId,
    name: r.account.name,
    email: r.account.email,
    mobile: opt(r.account.mobile),
    stage: STAGE_FROM_DB[r.stage] ?? 'Other',
    goals: r.goals,
    wings: r.wings.map((w) => w.wing.number).sort((a, b) => a - b),
    preferredMentorId: opt(r.preferredMentorId),
    status: lower(r.status),
    mentorId: opt(r.mentorId),
    matchedAt: isoOpt(r.matchedAt),
    adminNote: opt(r.adminNote),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

export async function listMentors(where: Prisma.MentorWhereInput = {}, db: Tx = prisma): Promise<MentorProfile[]> {
  return (await db.mentor.findMany({ where, include: mentorInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })).map(toMentor);
}
export async function listMentorshipRequests(where: Prisma.MentorshipRequestWhereInput = {}, db: Tx = prisma): Promise<MentorshipRequest[]> {
  return (await db.mentorshipRequest.findMany({ where, include: requestInclude, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] })).map(toRequest);
}

async function wingIds(db: Tx, numbers: number[]) {
  return (await db.wing.findMany({ where: { number: { in: numbers } }, select: { id: true } })).map((w) => w.id);
}

/** Creates or replaces the member's mentor profile (status reset to pending on create). */
export async function saveMentor(
  accountId: string,
  p: Pick<MentorProfile, 'headline' | 'expertise' | 'wings' | 'modes' | 'capacity' | 'bio'> & { city?: string; linkedinUrl?: string },
  db?: Tx
): Promise<MentorProfile> {
  const run = async (tx: Tx) => {
    const data = {
      headline: p.headline,
      expertise: p.expertise,
      modes: p.modes.map((m) => MODE_TO_DB[m] ?? 'ONLINE'),
      city: p.city || null,
      capacity: p.capacity,
      bio: p.bio,
      linkedinUrl: p.linkedinUrl || null,
    };
    const current = await tx.mentor.findUnique({ where: { accountId }, select: { status: true } });
    // A previously rejected profile goes back to review when it is edited.
    const m = await tx.mentor.upsert({
      where: { accountId },
      create: { accountId, ...data },
      update: { ...data, ...(current?.status === 'REJECTED' ? { status: 'PENDING' as const } : {}) },
    });
    await tx.mentorWing.deleteMany({ where: { mentorId: m.id } });
    const ids = await wingIds(tx, p.wings);
    if (ids.length) await tx.mentorWing.createMany({ data: ids.map((wingId) => ({ mentorId: m.id, wingId })) });
    return toMentor((await tx.mentor.findUnique({ where: { id: m.id }, include: mentorInclude }))!);
  };
  return db ? run(db) : prisma.$transaction(run);
}

export async function setMentorStatus(id: string, status: MentorProfile['status'], db: Tx = prisma): Promise<MentorProfile | null> {
  try {
    return toMentor(await db.mentor.update({ where: { id }, data: { status: upper(status) as 'PENDING' }, include: mentorInclude }));
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return null;
    throw err;
  }
}

export async function createMentorshipRequest(
  accountId: string,
  p: { stage: MentorshipStage; goals: string; wings: number[]; preferredMentorId?: string },
  db?: Tx
): Promise<MentorshipRequest> {
  const run = async (tx: Tx) => {
    const r = await tx.mentorshipRequest.create({
      data: { accountId, stage: STAGE_TO_DB[p.stage] as 'OTHER', goals: p.goals, preferredMentorId: p.preferredMentorId || null },
    });
    const ids = await wingIds(tx, p.wings);
    if (ids.length) await tx.mentorshipRequestWing.createMany({ data: ids.map((wingId) => ({ requestId: r.id, wingId })) });
    return toRequest((await tx.mentorshipRequest.findUnique({ where: { id: r.id }, include: requestInclude }))!);
  };
  return db ? run(db) : prisma.$transaction(run);
}

export async function updateMentorshipRequest(
  id: string,
  patch: Partial<Pick<MentorshipRequest, 'status' | 'mentorId' | 'matchedAt' | 'adminNote'>>,
  db: Tx = prisma
): Promise<MentorshipRequest | null> {
  try {
    const r = await db.mentorshipRequest.update({
      where: { id },
      data: strip({
        status: patch.status ? upper(patch.status) : undefined,
        mentorId: has(patch as AnyItem, 'mentorId') ? (patch.mentorId ?? null) : undefined,
        matchedAt: has(patch as AnyItem, 'matchedAt') ? (toDate(patch.matchedAt) ?? null) : undefined,
        adminNote: has(patch as AnyItem, 'adminNote') ? (patch.adminNote || null) : undefined,
      }) as Prisma.MentorshipRequestUncheckedUpdateInput,
      include: requestInclude,
    });
    return toRequest(r);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return null;
    throw err;
  }
}

// =============================================================================================
// Rate limits — fixed-window counters shared by every server instance (rate_limit_buckets)
// =============================================================================================

/** "scope:hash" — emails and IPs are never stored in clear, and keys stay short. */
function bucketKey(key: string): string {
  const scope = key.split(':', 1)[0]!.slice(0, 40);
  return `${scope}:${sha256(key).slice(0, 48)}`;
}

/** Counts one hit for `key` in a window of `windowMs`; returns the count in the current window. */
export async function rateLimitHit(key: string, windowMs: number): Promise<number> {
  const k = bucketKey(key);
  const ms = Math.max(1000, Math.round(windowMs));
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit_buckets (key, count, window_start, expires_at)
    VALUES (${k}, 1, now(), now() + ${ms} * interval '1 millisecond')
    ON CONFLICT (key) DO UPDATE SET
      count        = CASE WHEN rate_limit_buckets.expires_at <= now() THEN 1 ELSE rate_limit_buckets.count + 1 END,
      window_start = CASE WHEN rate_limit_buckets.expires_at <= now() THEN now() ELSE rate_limit_buckets.window_start END,
      expires_at   = CASE WHEN rate_limit_buckets.expires_at <= now() THEN EXCLUDED.expires_at ELSE rate_limit_buckets.expires_at END
    RETURNING count`;
  // Now and then, drop long-expired buckets so the table stays small.
  if (Math.random() < 0.01) {
    await prisma.$executeRaw`DELETE FROM rate_limit_buckets WHERE expires_at < now() - interval '1 day'`.catch(() => undefined);
  }
  return Number(rows[0]?.count ?? 1);
}

/** Hits counted for `key` in its current window, and the milliseconds until the window ends. */
export async function rateLimitPeek(key: string): Promise<{ count: number; resetsInMs: number }> {
  const rows = await prisma.$queryRaw<{ count: number; ms: number }[]>`
    SELECT count, (EXTRACT(EPOCH FROM (expires_at - now())) * 1000)::int AS ms
    FROM rate_limit_buckets WHERE key = ${bucketKey(key)} AND expires_at > now()`;
  return rows[0] ? { count: Number(rows[0].count), resetsInMs: Number(rows[0].ms) } : { count: 0, resetsInMs: 0 };
}

export async function rateLimitClear(key: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM rate_limit_buckets WHERE key = ${bucketKey(key)}`;
}

// =============================================================================================
// Legal pages — admin-edited wording; pages without a row use the defaults in @ascend/shared
// =============================================================================================

export interface LegalDocumentRow {
  slug: string;
  title: string;
  summary: string;
  content: string;
  updatedAt: string;
}

export async function listLegalDocuments(): Promise<LegalDocumentRow[]> {
  const rows = await prisma.legalDocument.findMany({ orderBy: { slug: 'asc' } });
  return rows.map((r) => ({ slug: r.slug, title: r.title, summary: r.summary, content: r.content, updatedAt: iso(r.updatedAt) }));
}

export async function saveLegalDocument(doc: Omit<LegalDocumentRow, 'updatedAt'>): Promise<LegalDocumentRow> {
  const data = { title: doc.title, summary: doc.summary, content: doc.content };
  const r = await prisma.legalDocument.upsert({ where: { slug: doc.slug }, create: { slug: doc.slug, ...data }, update: data });
  return { slug: r.slug, title: r.title, summary: r.summary, content: r.content, updatedAt: iso(r.updatedAt) };
}

/** Goes back to the default wording. */
export async function deleteLegalDocument(slug: string): Promise<boolean> {
  const { count } = await prisma.legalDocument.deleteMany({ where: { slug } });
  return count > 0;
}

// =============================================================================================
// Whole private store (admin lists, exports, analytics) — same shape as private-store.json
// =============================================================================================

export async function readPrivateStore(): Promise<PrivateStoreData> {
  const [registrations, members, messages, mentors, mentorshipRequests] = await Promise.all([
    listRegistrations(), listMembers(), listMessages(), listMentors(), listMentorshipRequests(),
  ]);
  return { registrations, members, messages, mentors, mentorshipRequests };
}

export { prisma };
