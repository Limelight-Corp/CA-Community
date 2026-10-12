#!/usr/bin/env node
/**
 * Copies the JSON stores in data/ into PostgreSQL, in ONE transaction (all or nothing).
 *
 *   npm run import --workspace=@ascend/db              # refuses if the database already has data
 *   npm run import --workspace=@ascend/db -- --replace # empties the tables first, then imports
 *     (refuses when the live site has created records that are not in the JSON files, unless
 *      --discard-new-data is also given — never use it after go-live without a backup)
 *
 * The JSON files are only read, never changed. Plaintext booking tokens and check-in codes are
 * stored as SHA-256 hashes (existing links keep working: the app hashes what it receives). Rows
 * the database rules would reject are fixed and listed in the report (e.g. a missing date).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readEnvFile, withDatabase } from './env.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, '..');
const root = path.resolve(pkg, '../..');
const replace = process.argv.includes('--replace');

const env = { ...readEnvFile(path.join(pkg, '.env')), ...process.env };
if (!env.DATABASE_MIGRATION_URL) {
  console.error('import: set DATABASE_MIGRATION_URL in packages/db/.env');
  process.exit(1);
}
const url = withDatabase(env.DATABASE_MIGRATION_URL, process.env.ASCEND_DB_NAME || 'ascend');
const { PrismaClient } = await import('../generated/client/index.js');

// Booking tokens are stored hashed (lookup) and sealed with the website's key (to show links again).
const tokenKeyHex = readEnvFile(path.join(root, 'apps/web/.env.local')).BOOKING_TOKEN_KEY;
if (!tokenKeyHex || !/^[0-9a-f]{64}$/i.test(tokenKeyHex)) {
  console.error('import: BOOKING_TOKEN_KEY is missing in apps/web/.env.local — run `npm run setup --workspace=@ascend/db` first.');
  process.exit(1);
}
const tokenKey = Buffer.from(tokenKeyHex, 'hex');
function seal(plain) {
  if (!plain) return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', tokenKey, iv);
  const body = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  return `v1.${iv.toString('base64url')}.${body.toString('base64url')}.${c.getAuthTag().toString('base64url')}`;
}
const db = new PrismaClient({ datasourceUrl: url, log: ['error'] });

const read = (f, fallback) => {
  const p = path.join(root, 'data', f);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : fallback;
};
const store = read('community-store.json', {});
const priv = read('private-store.json', {});
const accounts = read('member-accounts.json', { accounts: [] }).accounts ?? [];
const admins = read('admin-users.json', { users: [] }).users ?? [];

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const up = (v) => String(v).toUpperCase().replace(/[\s-]+/g, '_');
const date = (v) => (v ? new Date(v) : null);
const dateOnly = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? new Date(d.toISOString().slice(0, 10)) : null;
};
const slugify = (s) => s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const blank = (v) => (v === undefined || v === null || v === '' ? null : v);
const fixes = [];
const STAGE = { 'CA student': 'CA_STUDENT', 'Newly qualified CA': 'NEWLY_QUALIFIED', 'Practising CA': 'PRACTISING', 'Industry professional': 'INDUSTRY', Other: 'OTHER' };
const TAXONOMY = { eventCategories: 'EVENT_CATEGORY', newsCategories: 'NEWS_CATEGORY', resourceCategories: 'RESOURCE_CATEGORY', galleryCategories: 'GALLERY_CATEGORY', jobTypes: 'JOB_TYPE' };

// Child tables first, so --replace can empty everything without breaking foreign keys.
const TABLES = [
  'audit_logs', 'notification_outbox', 'contact_messages', 'mentorship_request_wings', 'mentorship_requests', 'mentor_wings', 'mentors',
  'membership_interests', 'membership_payments', 'memberships', 'event_registrations', 'auth_tokens', 'member_profiles', 'member_accounts',
  'admin_users', 'event_speakers', 'event_agenda_items', 'events', 'speakers', 'news_articles', 'resources', 'gallery_items', 'team_members',
  'testimonials', 'initiatives', 'jobs', 'wings', 'taxonomy_terms', 'site_settings', 'rate_limit_buckets',
];

const existing = await db.$queryRawUnsafe(
  `SELECT (SELECT count(*) FROM events) + (SELECT count(*) FROM member_accounts) + (SELECT count(*) FROM event_registrations) AS n`
);
if (Number(existing[0].n) > 0 && !replace) {
  console.error('import: the database already has data. Re-run with --replace to empty it and import again.');
  process.exit(1);
}

// Safety net after go-live: --replace would erase records the live site created (they are not in
// the JSON files). Refuse unless explicitly told to discard them.
if (replace && !process.argv.includes('--discard-new-data')) {
  const known = (list) => (list ?? []).map((x) => x.id);
  const newer = {
    bookings: await db.eventRegistration.count({ where: { id: { notIn: known(priv.registrations) } } }),
    accounts: await db.memberAccount.count({ where: { id: { notIn: known(accounts) } } }),
    memberships: await db.membership.count({ where: { id: { notIn: known(priv.members) } } }),
    messages: await db.contactMessage.count({ where: { id: { notIn: known(priv.messages) } } }),
  };
  const total = Object.values(newer).reduce((a, b) => a + b, 0);
  if (total > 0) {
    console.error(`import: the database has records that are not in data/*.json (${Object.entries(newer).filter(([, n]) => n).map(([k, n]) => `${n} ${k}`).join(', ')}).`);
    console.error('--replace would erase them. Take a backup (npm run backup), then add --discard-new-data only if you really mean it.');
    process.exit(1);
  }
}

await db.$transaction(
  async (tx) => {
    if (replace) {
      // The audit log is append-only by design; the import is the one place allowed to clear it.
      await tx.$executeRawUnsafe('ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_no_truncate');
      await tx.$executeRawUnsafe(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY`);
      await tx.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_no_truncate');
    }

    // ---- settings & categories
    const s = store.settings ?? {};
    await tx.siteSettings.create({
      data: {
        id: 1, siteName: s.siteName ?? 'ASCEND', tagline: s.tagline ?? '', heroEyebrow: s.heroEyebrow ?? '', heroHeadline: s.heroHeadline ?? '',
        heroHeadlineAccent: s.heroHeadlineAccent ?? '', heroIntro: s.heroIntro ?? '', heroImageUrl: blank(s.heroImageUrl), announcement: blank(s.announcement),
        feeCore: s.membershipFees?.core ?? null, feeAssociate: s.membershipFees?.associate ?? null, feeStudent: s.membershipFees?.student ?? null,
        contactEmail: blank(s.contact?.email), contactPhone: blank(s.contact?.phone), contactAddress: blank(s.contact?.address), contactMapUrl: blank(s.contact?.mapUrl),
        socialLinkedin: blank(s.social?.linkedin), socialInstagram: blank(s.social?.instagram), socialFacebook: blank(s.social?.facebook),
        socialYoutube: blank(s.social?.youtube), socialX: blank(s.social?.x),
      },
    });
    for (const [key, kind] of Object.entries(TAXONOMY))
      for (const [i, value] of (s.taxonomies?.[key] ?? []).entries()) await tx.taxonomyTerm.create({ data: { kind, value, sortOrder: i } });

    // ---- content
    const wingByNumber = new Map(), wingByName = new Map();
    for (const w of store.wings ?? []) {
      await tx.wing.create({
        data: { id: w.id, number: w.number, name: w.name, slug: slugify(w.name), color: w.color, tags: w.tags ?? '', activities: w.activities ?? [], isPublished: w.isPublished !== false, createdAt: date(w.createdAt) ?? undefined, updatedAt: date(w.updatedAt) ?? undefined },
      });
      wingByNumber.set(w.number, w.id);
      wingByName.set(w.name.toLowerCase(), w.id);
    }
    const wingFor = (name, where) => {
      if (!name) return null;
      const id = wingByName.get(name.trim().toLowerCase());
      if (!id) fixes.push(`${where}: wing "${name}" does not exist — left without a wing`);
      return id ?? null;
    };
    const speakerBySlug = new Map();
    for (const sp of store.speakers ?? []) {
      await tx.speaker.create({
        data: {
          id: sp.id, slug: sp.slug, name: sp.name, title: sp.title, qualification: blank(sp.qualification), organisation: blank(sp.organisation), headline: blank(sp.headline),
          bio: sp.bio, expertise: sp.expertise ?? [], highlights: sp.highlights ?? [], talks: sp.talks ?? [], stats: sp.stats ?? [], quote: blank(sp.quote),
          avatarUrl: blank(sp.avatarUrl), linkedinUrl: blank(sp.linkedinUrl), isPublished: sp.isPublished !== false, createdAt: date(sp.createdAt) ?? undefined, updatedAt: date(sp.updatedAt) ?? undefined,
        },
      });
      speakerBySlug.set(sp.slug, sp.id);
    }
    for (const e of store.events ?? []) {
      let description = e.description;
      if (!description?.trim()) {
        description = '(description to be added)';
        fixes.push(`event "${e.slug}": empty description — placeholder used`);
      }
      await tx.event.create({
        data: {
          id: e.id, slug: e.slug, title: e.title, wingId: wingByNumber.get(e.wingNumber), category: e.category, date: dateOnly(e.date), time: e.time, endTime: blank(e.endTime),
          mode: up(e.mode), venue: e.venue, city: e.city ?? '', mapUrl: blank(e.mapUrl), fee: e.fee ?? 0, memberFee: e.memberFee ?? 0, seatsTotal: e.seatsTotal ?? 0,
          seatsTaken: e.seatsTaken ?? 0, cpeHours: e.cpeHours ?? null, description, terms: blank(e.terms), imageUrl: blank(e.imageUrl),
          registrationOpen: e.registrationOpen !== false, featured: !!e.featured, isPublished: e.isPublished !== false, cancelledAt: date(e.cancelledAt),
          cancellationNote: blank(e.cancellationNote), createdAt: date(e.createdAt) ?? undefined, updatedAt: date(e.updatedAt) ?? undefined,
          agenda: { create: (e.agenda ?? []).map((a, position) => ({ position, time: a.time ?? '', title: a.title, speaker: blank(a.speaker) })) },
        },
      });
      for (const [position, slug] of (e.speakerSlugs ?? []).entries()) {
        if (speakerBySlug.has(slug)) await tx.eventSpeaker.create({ data: { eventId: e.id, speakerId: speakerBySlug.get(slug), position } });
        else fixes.push(`event "${e.slug}": speaker "${slug}" does not exist — link dropped`);
      }
    }
    for (const n of store.news ?? [])
      await tx.newsArticle.create({
        data: {
          id: n.id, slug: n.slug, title: n.title, category: n.category, dateLabel: n.date, publishedOn: dateOnly(n.date) ?? dateOnly(n.createdAt) ?? new Date(),
          author: blank(n.author), summary: n.summary, content: n.content, coverImageUrl: blank(n.coverImageUrl), isPublished: n.isPublished !== false, createdAt: date(n.createdAt) ?? undefined, updatedAt: date(n.updatedAt) ?? undefined,
        },
      });
    for (const r of store.resources ?? [])
      await tx.resource.create({
        data: {
          id: r.id, title: r.title, category: r.category, format: r.format, wingId: wingFor(r.wing, `resource "${r.title}"`), fileUrl: blank(r.fileUrl),
          isMembersOnly: !!r.isMembersOnly, downloads: r.downloads ?? 0, isPublished: r.isPublished !== false, createdAt: date(r.createdAt) ?? undefined, updatedAt: date(r.updatedAt) ?? undefined,
        },
      });
    for (const g of store.gallery ?? [])
      await tx.galleryItem.create({
        data: {
          id: g.id, title: g.title, category: g.category, dateLabel: g.date, location: g.location, accentGradient: g.accentGradient ?? '', imageUrl: blank(g.imageUrl),
          videoUrl: blank(g.videoUrl), isPublished: g.isPublished !== false, createdAt: date(g.createdAt) ?? undefined, updatedAt: date(g.updatedAt) ?? undefined,
        },
      });
    for (const t of store.team ?? [])
      await tx.teamMember.create({
        data: {
          id: t.id, name: t.name, designation: t.designation, group: up(t.group), wingId: wingFor(t.wing, `team member "${t.name}"`), background: blank(t.background),
          photoUrl: blank(t.photoUrl), linkedinUrl: blank(t.linkedinUrl), sortOrder: t.order ?? 10, isPublished: t.isPublished !== false, createdAt: date(t.createdAt) ?? undefined, updatedAt: date(t.updatedAt) ?? undefined,
        },
      });
    for (const t of store.testimonials ?? [])
      await tx.testimonial.create({ data: { id: t.id, name: t.name, designation: blank(t.designation), quote: t.quote, photoUrl: blank(t.photoUrl), isPublished: t.isPublished !== false } });
    for (const i of store.initiatives ?? [])
      await tx.initiative.create({
        data: {
          id: i.id, title: i.title, description: i.description, tag: blank(i.tag), date: dateOnly(i.date), ctaLabel: blank(i.ctaLabel), ctaUrl: blank(i.ctaUrl),
          imageUrl: blank(i.imageUrl), isPublished: i.isPublished !== false, createdAt: date(i.createdAt) ?? undefined, updatedAt: date(i.updatedAt) ?? undefined,
        },
      });
    for (const j of store.jobs ?? [])
      await tx.job.create({
        data: {
          id: j.id, slug: j.slug, title: j.title, organisation: j.organisation, type: j.type, location: j.location, workMode: up(j.workMode), experience: blank(j.experience),
          compensation: blank(j.compensation), description: j.description, requirements: j.requirements ?? [], applyUrl: blank(j.applyUrl), applyEmail: blank(j.applyEmail),
          deadline: dateOnly(j.deadline), wingId: wingFor(j.wing, `job "${j.slug}"`), logoUrl: blank(j.logoUrl), isMembersOnly: !!j.isMembersOnly, featured: !!j.featured,
          isPublished: j.isPublished !== false, createdAt: date(j.createdAt) ?? undefined, updatedAt: date(j.updatedAt) ?? undefined,
        },
      });

    // ---- accounts (logins)
    for (const a of accounts) {
      const p = a.profile ?? {};
      await tx.memberAccount.create({
        data: {
          id: a.id, name: a.name, email: a.email.trim().toLowerCase(), mobile: blank(a.mobile), passwordHash: a.passwordHash, emailVerifiedAt: date(a.emailVerifiedAt),
          sessionVersion: a.sessionVersion ?? 1, lastLoginAt: date(a.lastLoginAt), createdAt: date(a.createdAt) ?? undefined, updatedAt: date(a.updatedAt) ?? undefined,
          profile: {
            create: {
              city: blank(p.city), membershipNo: blank(p.membershipNo), qualificationYear: blank(p.qualificationYear), areaOfPractice: blank(p.areaOfPractice),
              organisation: blank(p.organisation), designation: blank(p.designation), linkedinUrl: blank(p.linkedinUrl), bio: blank(p.bio), photoUrl: blank(p.photoUrl),
              directoryOptIn: !!p.directoryOptIn,
            },
          },
        },
      });
      // Still-valid verify / reset links keep working (they were already stored as hashes).
      for (const [purpose, tokenHash, exp] of [['EMAIL_VERIFY', a.verifyTokenHash, a.verifyTokenExp], ['PASSWORD_RESET', a.resetTokenHash, a.resetTokenExp]])
        if (tokenHash && exp && Date.parse(exp) > Date.now()) await tx.authToken.create({ data: { accountId: a.id, purpose, tokenHash, expiresAt: new Date(exp) } });
    }
    const accountByEmail = new Map(accounts.map((a) => [a.email.trim().toLowerCase(), a.id]));
    for (const u of admins)
      await tx.adminUser.create({
        data: {
          id: u.id, username: u.username, name: u.name, role: up(u.role), passwordHash: u.passwordHash, active: u.active !== false,
          passwordChangedAt: new Date((u.passwordChangedAt ?? 0) * 1000), lastLoginAt: date(u.lastLoginAt), createdAt: date(u.createdAt) ?? undefined, updatedAt: date(u.updatedAt) ?? undefined,
        },
      });

    // ---- bookings
    let attendedFixed = 0, paidFixed = 0, refundFixed = 0;
    for (const r of priv.registrations ?? []) {
      let attendedAt = date(r.attendedAt);
      if (r.attended && !attendedAt) { attendedAt = date(r.updatedAt); attendedFixed++; }
      let paidAt = date(r.paidAt);
      if ((r.paymentStatus === 'paid' || r.paymentStatus === 'refunded') && !paidAt) { paidAt = date(r.createdAt); paidFixed++; }
      let refundedAt = date(r.refundedAt);
      if (r.paymentStatus === 'refunded' && !refundedAt) { refundedAt = date(r.updatedAt); refundFixed++; }
      await tx.eventRegistration.create({
        data: {
          id: r.id, bookingId: r.bookingId, accessTokenHash: sha(r.accessToken), checkinCodeHash: r.checkinCode ? sha(r.checkinCode) : null,
          accessTokenEnc: seal(r.accessToken), checkinCodeEnc: seal(r.checkinCode), eventId: r.eventId,
          accountId: accountByEmail.get(r.email.trim().toLowerCase()) ?? null, eventTitle: r.eventTitle, name: r.name, email: r.email, mobile: r.mobile, city: r.city,
          membershipNo: blank(r.membershipNo), organisation: blank(r.organisation), designation: blank(r.designation), requirements: blank(r.requirements),
          whatsappOptIn: !!r.whatsappOptIn, fee: r.fee ?? 0, status: up(r.status), paymentStatus: up(r.paymentStatus), gatewayOrderId: blank(r.gatewayOrderId),
          gatewayPaymentId: blank(r.gatewayPaymentId), paidAt, refundId: blank(r.refundId), refundAmount: r.refundAmount ?? null, refundedAt, attended: !!r.attended,
          attendedAt, certificateId: blank(r.certificateId), reminderSentAt: date(r.reminderSentAt), createdAt: date(r.createdAt) ?? undefined, updatedAt: date(r.updatedAt) ?? undefined,
        },
      });
    }
    if (attendedFixed) fixes.push(`${attendedFixed} bookings marked attended had no check-in time — used their last update time`);
    if (paidFixed) fixes.push(`${paidFixed} paid/refunded bookings had no payment date — used their booking time`);
    if (refundFixed) fixes.push(`${refundFixed} refunded bookings had no refund date — used their last update time`);

    // ---- memberships
    for (const m of priv.members ?? []) {
      await tx.membership.create({
        data: {
          id: m.id, accountId: accountByEmail.get(m.email.trim().toLowerCase()) ?? null, name: m.name, email: m.email, mobile: m.mobile, city: m.city, plan: up(m.plan),
          membershipNo: blank(m.membershipNo), qualificationYear: blank(m.qualificationYear), areaOfPractice: blank(m.areaOfPractice), organisation: blank(m.organisation),
          linkedinUrl: blank(m.linkedinUrl), photoUrl: blank(m.photoUrl), status: up(m.status), fee: m.membershipFee ?? null, gatewayOrderId: blank(m.gatewayOrderId),
          validUntil: date(m.validUntil), renewalReminderFor: date(m.renewalReminderFor), createdAt: date(m.createdAt) ?? undefined, updatedAt: date(m.updatedAt) ?? undefined,
          interests: { create: (m.interests ?? []).filter((n) => wingByNumber.has(n)).map((n) => ({ wingId: wingByNumber.get(n) })) },
          payments: {
            create: (m.payments ?? []).map((p) => ({
              receiptId: p.id, amount: p.amount, method: up(p.method), gatewayOrderId: blank(p.gatewayOrderId), gatewayPaymentId: blank(p.gatewayPaymentId),
              paidAt: new Date(p.paidAt), validFrom: new Date(p.validFrom), validUntil: new Date(p.validUntil), recordedById: blank(p.recordedBy),
            })),
          },
        },
      });
    }

    // ---- mentorship & inbox
    for (const m of priv.mentors ?? [])
      await tx.mentor.create({
        data: {
          id: m.id, accountId: m.accountId, headline: m.headline, expertise: m.expertise ?? [], modes: (m.modes ?? []).map(up), city: blank(m.city), capacity: m.capacity ?? 1,
          bio: m.bio, linkedinUrl: blank(m.linkedinUrl), status: up(m.status), createdAt: date(m.createdAt) ?? undefined, updatedAt: date(m.updatedAt) ?? undefined,
          wings: { create: (m.wings ?? []).filter((n) => wingByNumber.has(n)).map((n) => ({ wingId: wingByNumber.get(n) })) },
        },
      });
    for (const r of priv.mentorshipRequests ?? [])
      await tx.mentorshipRequest.create({
        data: {
          id: r.id, accountId: r.accountId, stage: STAGE[r.stage] ?? 'OTHER', goals: r.goals, preferredMentorId: blank(r.preferredMentorId), mentorId: blank(r.mentorId),
          status: up(r.status), matchedAt: date(r.matchedAt), adminNote: blank(r.adminNote), createdAt: date(r.createdAt) ?? undefined, updatedAt: date(r.updatedAt) ?? undefined,
          wings: { create: (r.wings ?? []).filter((n) => wingByNumber.has(n)).map((n) => ({ wingId: wingByNumber.get(n) })) },
        },
      });
    for (const m of priv.messages ?? [])
      await tx.contactMessage.create({
        data: { id: m.id, name: m.name, email: m.email, phone: blank(m.phone), subject: m.subject, message: m.message, status: up(m.status), createdAt: date(m.createdAt) ?? undefined, updatedAt: date(m.createdAt) ?? undefined },
      });
  },
  { timeout: 120_000, maxWait: 30_000 }
);

// ---- report
const count = async (t) => Number((await db.$queryRawUnsafe(`SELECT count(*)::int AS n FROM ${t}`))[0].n);
const rows = [
  ['wings', (store.wings ?? []).length], ['events', (store.events ?? []).length], ['speakers', (store.speakers ?? []).length], ['news_articles', (store.news ?? []).length],
  ['resources', (store.resources ?? []).length], ['gallery_items', (store.gallery ?? []).length], ['team_members', (store.team ?? []).length],
  ['initiatives', (store.initiatives ?? []).length], ['jobs', (store.jobs ?? []).length], ['member_accounts', accounts.length], ['admin_users', admins.length],
  ['event_registrations', (priv.registrations ?? []).length], ['memberships', (priv.members ?? []).length], ['contact_messages', (priv.messages ?? []).length],
  ['mentors', (priv.mentors ?? []).length], ['mentorship_requests', (priv.mentorshipRequests ?? []).length],
];
let ok = true;
console.log('\nTable                 JSON   PostgreSQL');
for (const [t, n] of rows) {
  const got = await count(t);
  ok &&= got === n;
  console.log(`${t.padEnd(21)} ${String(n).padStart(4)}   ${String(got).padStart(4)}${got === n ? '' : '   ✗ MISMATCH'}`);
}
console.log('\nData fixed during import:\n' + (fixes.length ? fixes.map((f) => ' - ' + f).join('\n') : ' - none'));
await db.$disconnect();
console.log(ok ? '\n✓ Import complete — every count matches.' : '\n✗ Some counts differ — see above.');
process.exit(ok ? 0 : 1);
