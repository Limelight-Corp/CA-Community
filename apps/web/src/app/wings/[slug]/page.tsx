import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Linkedin,
  Lock,
  MapPin,
  Sparkles,
  Target,
  UserPlus,
} from 'lucide-react';
import type { CommunityResource, CommunitySpeaker, CommunityTeamMember, CommunityWing } from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker } from '@ascend/ui';
import { Countdown, Marquee, Reveal } from '../../../components/ui-client';
import { FxCard } from '../../../components/home/Interactive';
import { EventTile } from '../../../components/events/EventTile';
import { eventInstants, toIstIso } from '../../../components/events/event-time';
import { PillLink, Section } from '../../../components/content/ui';
import { getItems, getSettings } from '../../../lib/community-store';
import { eventSpeakers, formatEventDate, locationLabel, priceLabel } from '../../../lib/events';
import { resourceDownloadUrl, safeUrl } from '../../../lib/content';
import { allWingHubs, findWingHub, wingEvents, wingPeople, wingResources } from '../../../lib/wings';

type Params = Promise<{ slug: string }>;

// Rendered per request so conveners, events and resources added in the admin show up at once.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const wing = findWingHub(slug);
  if (!wing) return { title: 'Wing not found' };
  const { siteName } = getSettings();
  return {
    title: `${wing.name} Wing`,
    description: `${wing.name} — a professional wing of ${siteName}: ${wing.focus.join(', ')}. Convener, events and resources.`,
    alternates: { canonical: `/wings/${wing.slug}` },
  };
}

function PersonCard({ person, convener }: { person: CommunityTeamMember; convener?: boolean }) {
  const linkedin = safeUrl(person.linkedinUrl);
  return (
    <FxCard
      max={6}
      className={`group flex h-full items-start gap-4 rounded-[24px] border p-5 ${convener ? 'border-gold/30 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'}`}
    >
      <span className={convener ? 'halo shrink-0 rounded-2xl' : 'shrink-0'}>
        <Avatar name={person.name} src={safeUrl(person.photoUrl)} size={64} rounded="xl" />
      </span>
      <div className="min-w-0 flex-1">
        {convener && <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">Convener</span>}
        <h3 className="font-display text-[20px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)]">{person.name}</h3>
        <p className="mt-0.5 text-[13.5px] text-[var(--muted)]">{person.designation}</p>
        {person.background && <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--fg-soft)]">{person.background}</p>}
      </div>
      {linkedin && (
        <a
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${person.name} on LinkedIn`}
          className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] hover:border-gold/60 hover:text-gold"
        >
          <Linkedin className="h-4 w-4" aria-hidden />
        </a>
      )}
    </FxCard>
  );
}

function ResourceRow({ r }: { r: CommunityResource }) {
  const stored = safeUrl(r.fileUrl);
  const file = stored ? resourceDownloadUrl(r.id) : undefined;
  return (
    <li className="group flex items-center gap-4 rounded-2xl border border-mist/[0.1] bg-grad-surface px-4 py-3.5 transition hover:border-brand-300/40">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-200 transition-transform group-hover:-rotate-6">
        <FileText className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-[var(--fg)]">{r.title}</span>
        <span className="block text-[12.5px] text-[var(--muted)]">
          {r.category} · {r.format}
        </span>
      </span>
      {r.isMembersOnly ? (
        <a href={file ?? '/join'} className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-gold">
          <Lock className="h-4 w-4" aria-hidden /> Members
        </a>
      ) : file ? (
        <a href={file} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--fg)] hover:text-brand-200">
          {/\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|$)/i.test(stored ?? '') ? <Download className="h-4 w-4" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
          Open
        </a>
      ) : (
        <span className="shrink-0 text-[12.5px] text-[var(--muted)]">Coming soon</span>
      )}
    </li>
  );
}

export default async function WingHubPage({ params }: { params: Params }) {
  const { slug } = await params;
  const wing = findWingHub(slug);
  if (!wing) notFound();

  const all = allWingHubs();
  const idx = all.findIndex((w) => w.slug === wing.slug);
  const prev = all[(idx - 1 + all.length) % all.length]!;
  const next = all[(idx + 1) % all.length]!;
  const { conveners, committee } = wingPeople(wing);
  const { upcoming, past } = wingEvents(wing);
  const wingRes = wingResources(wing);
  const libraryPicks = wingRes.length ? [] : getItems<CommunityResource>('resources', true).slice(0, 3);
  const storeWing = getItems<CommunityWing>('wings', true).find((w) => w.number === wing.number);
  const speakers = getItems<CommunitySpeaker>('speakers', true);
  const joinHref = `/join?wing=${wing.slug}#register`;
  const num = String(wing.number).padStart(2, '0');
  const nextEvent = upcoming[0];
  const words = wing.name.split(' ');

  const stats = [
    { v: upcoming.length, l: upcoming.length === 1 ? 'Upcoming event' : 'Upcoming events', icon: CalendarDays },
    { v: wing.activities.length, l: 'Formats', icon: Layers },
    { v: wing.focus.length, l: 'Focus areas', icon: Target },
    { v: wingRes.length, l: wingRes.length === 1 ? 'Resource' : 'Resources', icon: BookOpen },
  ];

  return (
    <>
      {/* ------------------------------------------------------------------ Hero */}
      <section className="grain relative overflow-hidden border-b border-[var(--line)]">
        <div className="aurora opacity-70" aria-hidden>
          <i />
        </div>
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-48 h-[620px] w-[620px] rounded-full opacity-45 blur-[130px]"
          style={{ background: wing.color }}
        />
        <Container size="wide" className="relative z-10 pb-14 pt-8 md:pb-20 md:pt-12">
          <Link href="/wings" className="inline-flex items-center gap-2 rounded-full py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--fg)]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All wings
          </Link>

          <div className="mt-6 grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div className="flex min-w-0 flex-col gap-6">
              <Kicker tone="gold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: wing.color, boxShadow: `0 0 12px ${wing.color}` }} aria-hidden />
                Professional wing {num} of {all.length}
              </Kicker>
              <h1 className="text-balance font-display text-[clamp(44px,7.4vw,104px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
                {words.length > 1 ? (
                  <>
                    {words.slice(0, -1).join(' ')} <AccentText tone="hero">{words.at(-1)}</AccentText>
                  </>
                ) : (
                  <AccentText tone="hero">{wing.name}</AccentText>
                )}
              </h1>
              <ul className="flex flex-wrap gap-2" aria-label="Focus areas">
                {wing.focus.map((f) => (
                  <li key={f} className="glass-panel rounded-full px-3.5 py-1.5 text-[13.5px] text-[var(--fg)]">
                    {f}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3 pt-1">
                <PillLink href={joinHref} variant="gold" icon={<UserPlus className="h-4 w-4" aria-hidden />}>
                  Join this Wing
                </PillLink>
                <PillLink href="#wing-events" variant="ghost" icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
                  Wing events
                </PillLink>
              </div>
            </div>

            {/* Wing at a glance */}
            <FxCard max={5} className="glass-panel relative overflow-hidden rounded-[30px] p-5 md:p-6">
              <span
                aria-hidden
                className="fx-ghost text-outline pointer-events-none absolute -right-3 -top-10 select-none font-display text-[180px] font-semibold leading-none tracking-[-0.06em] opacity-50"
              >
                {num}
              </span>
              <p className="relative font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Wing at a glance</p>
              <dl className="relative mt-4 grid grid-cols-2 gap-2.5">
                {stats.map(({ v, l, icon: Icon }) => (
                  <div key={l} className="rounded-2xl border border-mist/[0.1] bg-bg/50 p-3.5">
                    <dt className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
                      <Icon className="h-3.5 w-3.5 text-gold" aria-hidden /> {l}
                    </dt>
                    <dd className="mt-1 font-display text-[34px] font-medium leading-none tracking-[-0.04em] text-[var(--fg)] tabular-nums">
                      {String(v).padStart(2, '0')}
                    </dd>
                  </div>
                ))}
              </dl>
              {nextEvent ? (
                <Link
                  href={`/events/${nextEvent.slug}`}
                  className="group relative mt-3 flex flex-col gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] p-4 transition hover:border-gold/50"
                >
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">Next up in this wing</span>
                  <span className="font-display text-[19px] font-medium leading-snug text-[var(--fg)] group-hover:text-gold-soft">{nextEvent.title}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--muted)]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {formatEventDate(nextEvent, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden /> {locationLabel(nextEvent)}
                    </span>
                    <span className="font-semibold text-[var(--fg)]">{priceLabel(nextEvent.fee)}</span>
                  </span>
                  <Countdown to={toIstIso(eventInstants(nextEvent).start)} className="[&>div]:min-w-[52px]" />
                </Link>
              ) : (
                <p className="relative mt-3 rounded-2xl border border-dashed border-mist/[0.16] p-4 text-[13.5px] text-[var(--muted)]">
                  New dates for this wing are being planned — join the wing to hear first.
                </p>
              )}
            </FxCard>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ Focus marquee */}
      <div className="border-b border-[var(--line)] py-4">
        <Marquee ariaLabel={`${wing.name} focus areas and formats`} duration={40}>
          {[...wing.focus, ...wing.activities].map((t, i) => (
            <span key={`${t}-${i}`} className="inline-flex items-center gap-3 font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--muted)]">
              <Sparkles className="h-4 w-4" style={{ color: i % 2 ? 'rgb(var(--gold-rgb))' : wing.color }} aria-hidden />
              {t}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ------------------------------------------------------------------ Leadership */}
      <Section className="py-14 md:py-20" labelledBy="people-heading">
        <Container size="wide">
          <div className="flex flex-col gap-4">
            <Kicker>Wing leadership</Kicker>
            <h2 id="people-heading" className="font-display text-[clamp(32px,4.6vw,60px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
              Convener &amp; <AccentText tone="gold">committee.</AccentText>
            </h2>
          </div>
          {conveners.length + committee.length === 0 ? (
            <ul className="mt-10 grid gap-4 md:grid-cols-[1fr_1.2fr]">
              <li>
                <FxCard max={6} className="group flex h-full items-center gap-5 rounded-[26px] border border-gold/25 bg-gold/[0.05] p-6">
                  <span className="halo grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-bg/70">
                    <span className="font-display text-[34px] font-semibold text-[var(--muted)]">?</span>
                  </span>
                  <span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">Convener</span>
                    <span className="mt-1 block font-display text-[22px] font-medium leading-tight text-[var(--fg)]">To be announced</span>
                    <span className="mt-1 block text-[13.5px] text-[var(--muted)]">One convener leads each professional wing.</span>
                  </span>
                </FxCard>
              </li>
              <li>
                <FxCard max={6} className="group flex h-full flex-col justify-between gap-5 rounded-[26px] border border-mist/[0.1] bg-grad-surface p-6 sm:flex-row sm:items-center">
                  <span>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Get involved</span>
                    <span className="mt-1 block font-display text-[22px] font-medium leading-tight text-[var(--fg)]">Help shape this wing</span>
                    <span className="mt-1 block max-w-[38ch] text-[13.5px] text-[var(--muted)]">Join as a member and pick this wing — the committee is drawn from active members.</span>
                  </span>
                  <PillLink href={joinHref} variant="primary" className="shrink-0">
                    Join the wing
                  </PillLink>
                </FxCard>
              </li>
            </ul>
          ) : (
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...conveners.map((p) => ({ p, c: true })), ...committee.map((p) => ({ p, c: false }))].map(({ p, c }, i) => (
                <Reveal as="li" key={p.id} delay={(i % 3) * 80} className="h-full">
                  <PersonCard person={p} convener={c} />
                </Reveal>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ Events */}
      <Section id="wing-events" className="border-y border-[var(--line)] bg-grad-surface py-14 md:py-20" labelledBy="events-heading">
        <Container size="wide">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-4">
              <Kicker tone="gold">Webinars · workshops · meetups</Kicker>
              <h2 id="events-heading" className="font-display text-[clamp(32px,4.6vw,60px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
                Upcoming in this <AccentText tone="hero">wing.</AccentText>
              </h2>
            </div>
            <Link href="/events" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-[var(--fg)]">
              All events <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-8 flex flex-col gap-3 rounded-[24px] border border-dashed border-mist/[0.16] p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] text-[var(--muted)]">No upcoming events in this wing yet. New dates are added regularly.</p>
              <Link href="/events" className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-gold hover:text-gold-soft">
                Browse all events <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e, i) => (
                <Reveal as="li" key={e.id} delay={(i % 3) * 80} className="flex">
                  <EventTile className="w-full" event={e} wing={storeWing} speakers={eventSpeakers(e, speakers)} />
                </Reveal>
              ))}
            </ul>
          )}
          {past.length > 0 && (
            <div className="mt-10 border-t border-[var(--line)] pt-8">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Past events</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {past.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.12] px-3 py-1.5 text-[13px] text-[var(--fg-soft)] hover:border-mist/40">
                      {e.title} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ Formats */}
      <Section className="py-14 md:py-20" labelledBy="formats-heading">
        <Container size="wide">
          <div className="flex flex-col gap-4">
            <Kicker>Formats</Kicker>
            <h2 id="formats-heading" className="font-display text-[clamp(32px,4.6vw,60px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
              What this wing <AccentText tone="gold">runs.</AccentText>
            </h2>
          </div>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {wing.activities.map((a, i) => {
              const wide = i === 0 || i === wing.activities.length - 1;
              return (
                <Reveal as="li" key={a} delay={(i % 4) * 70} className={wide ? 'h-full sm:col-span-2' : 'h-full'}>
                  <FxCard
                    max={7}
                    className={`group flex h-full min-h-[120px] flex-col justify-between gap-4 overflow-hidden rounded-[22px] border p-5 ${wide ? 'border-gold/25 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'}`}
                  >
                    <span
                      aria-hidden
                      className="fx-ghost text-outline pointer-events-none absolute -right-1 -top-4 select-none font-display text-[84px] font-semibold leading-none tracking-[-0.06em] opacity-40"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="fx-icon relative grid h-9 w-9 place-items-center rounded-xl text-white" style={{ background: wing.color }}>
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    <span className={`relative font-display font-medium leading-tight tracking-[-0.02em] text-[var(--fg)] ${wide ? 'text-[22px]' : 'text-[17px]'}`}>{a}</span>
                  </FxCard>
                </Reveal>
              );
            })}
          </ol>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ Resources */}
      <Section className="border-t border-[var(--line)] py-14 md:py-20" labelledBy="resources-heading">
        <Container size="wide" className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <Kicker tone="gold">Knowledge</Kicker>
            <h2 id="resources-heading" className="font-display text-[clamp(32px,4.6vw,60px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
              Wing <AccentText tone="hero">resources.</AccentText>
            </h2>
            <p className="max-w-[42ch] text-[15px] leading-relaxed text-[var(--muted)]">
              {wingRes.length
                ? 'Guides, whitepapers and downloads from this wing.'
                : 'This wing’s whitepapers and guides will appear here. Meanwhile, from the knowledge library:'}
            </p>
            <Link href="/resources" className="inline-flex w-fit items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-[var(--fg)]">
              Open the library <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="flex min-w-0 flex-col gap-2.5">
            {(wingRes.length ? wingRes : libraryPicks).map((r) => (
              <ResourceRow key={r.id} r={r} />
            ))}
          </ul>
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ Join CTA */}
      <section className="pb-10 pt-4 md:pb-16">
        <Container size="wide">
          <div className="grain relative overflow-hidden rounded-[34px] border border-gold/25 bg-grad-surface p-7 md:p-12">
            <div className="aurora opacity-60" aria-hidden>
              <i />
            </div>
            <div aria-hidden className="pointer-events-none absolute -left-24 -top-32 h-[420px] w-[420px] rounded-full opacity-50 blur-[110px]" style={{ background: wing.color }} />
            <span
              aria-hidden
              className="text-outline pointer-events-none absolute -bottom-10 right-4 select-none font-display text-[clamp(140px,18vw,260px)] font-semibold leading-none tracking-[-0.06em] opacity-40"
            >
              {num}
            </span>
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex max-w-[760px] flex-col gap-4">
                <h2 className="font-display text-[clamp(34px,5vw,68px)] font-medium leading-[0.98] tracking-[-0.05em] text-[var(--fg)]">
                  Join the <AccentText tone="gold">{wing.name}</AccentText> wing.
                </h2>
                <p className="max-w-[52ch] text-[16px] leading-relaxed text-[var(--muted)]">
                  Members can join as many wings as they like — pick this one when you apply.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <PillLink href={joinHref} variant="gold" icon={<UserPlus className="h-4 w-4" aria-hidden />}>
                  Join this Wing
                </PillLink>
                <PillLink href="/wings" variant="ghost">
                  Explore all wings
                </PillLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ Other wings */}
      <section className="border-t border-[var(--line)] py-8">
        <Container size="wide" className="grid gap-3 sm:grid-cols-2">
          {[
            { w: prev, label: 'Previous wing', icon: <ArrowLeft className="h-4 w-4" aria-hidden /> },
            { w: next, label: 'Next wing', icon: <ArrowRight className="h-4 w-4" aria-hidden /> },
          ].map(({ w, label, icon }, i) => (
            <Link
              key={label}
              href={`/wings/${w.slug}`}
              className={`group flex items-center gap-4 rounded-[22px] border border-mist/[0.1] p-4 transition hover:border-gold/30 ${i ? 'sm:flex-row-reverse sm:text-right' : ''}`}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mist/[0.08] text-[var(--fg)] transition group-hover:bg-grad-primary group-hover:text-white">
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
                <span className="block truncate font-display text-[18px] text-[var(--fg)]">{w.name}</span>
              </span>
            </Link>
          ))}
        </Container>
      </section>
    </>
  );
}
