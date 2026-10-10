import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Download, ExternalLink, FileText, Linkedin, Lock, Sparkles, UserPlus, Users } from 'lucide-react';
import type { CommunitySpeaker, CommunityTeamMember, CommunityWing } from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker } from '@ascend/ui';
import { Reveal } from '../../../components/ui-client';
import { FxCard } from '../../../components/home/Interactive';
import { EventTile } from '../../../components/events/EventTile';
import { CtaBand, PillLink, Section } from '../../../components/content/ui';
import { getItems, getSettings } from '../../../lib/community-store';
import { eventSpeakers } from '../../../lib/events';
import { safeUrl } from '../../../lib/content';
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
    <FxCard max={6} className={`group flex h-full items-start gap-4 rounded-[24px] border p-5 ${convener ? 'border-gold/30 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'}`}>
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
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] hover:border-gold/60 hover:text-gold"
        >
          <Linkedin className="h-4 w-4" aria-hidden />
        </a>
      )}
    </FxCard>
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
  const resources = wingResources(wing);
  const storeWings = getItems<CommunityWing>('wings', true);
  const speakers = getItems<CommunitySpeaker>('speakers', true);
  const storeWing = storeWings.find((w) => w.number === wing.number);
  const joinHref = `/join?wing=${wing.slug}#register`;
  const num = String(wing.number).padStart(2, '0');

  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden border-b border-[var(--line)] pb-16 pt-10 md:pb-20 md:pt-14">
        <div className="aurora opacity-70" aria-hidden>
          <i />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full opacity-50 blur-[120px]"
          style={{ background: wing.color }}
        />
        <span
          aria-hidden
          className="text-outline pointer-events-none absolute -bottom-[0.2em] right-[-0.02em] select-none font-display text-[clamp(160px,28vw,420px)] font-semibold leading-none tracking-[-0.06em] opacity-40"
        >
          {num}
        </span>
        <Container size="wide" className="relative z-10">
          <Link
            href="/wings"
            className="inline-flex items-center gap-2 rounded-full py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> All wings
          </Link>
          <div className="mt-6 flex max-w-[1000px] flex-col gap-6">
            <Kicker tone="gold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: wing.color, boxShadow: `0 0 12px ${wing.color}` }} aria-hidden />
              Wing {num}
            </Kicker>
            <h1 className="text-balance font-display text-[clamp(44px,8vw,112px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
              {wing.name.split(' ').slice(0, -1).join(' ')} <AccentText tone="hero">{wing.name.split(' ').at(-1)}</AccentText>
            </h1>
            <ul className="flex flex-wrap gap-2" aria-label="Focus areas">
              {wing.focus.map((f) => (
                <li key={f} className="glass-panel rounded-full px-3.5 py-1.5 text-[13.5px] text-[var(--fg)]">
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <PillLink href={joinHref} variant="gold" icon={<UserPlus className="h-4 w-4" aria-hidden />}>
                Join this Wing
              </PillLink>
              <PillLink href="#wing-events" variant="ghost" icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
                Wing events{upcoming.length ? ` · ${upcoming.length}` : ''}
              </PillLink>
            </div>
          </div>
        </Container>
      </section>

      {/* Convener & committee */}
      <Section className="pt-14 md:pt-20" labelledBy="people-heading">
        <Container size="wide">
          <div className="flex flex-col gap-4">
            <Kicker>Wing leadership</Kicker>
            <h2 id="people-heading" className="font-display text-[clamp(32px,4.6vw,60px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
              Convener &amp; <AccentText tone="gold">committee.</AccentText>
            </h2>
          </div>
          {conveners.length + committee.length === 0 ? (
            <div className="mt-8 flex flex-col gap-3 rounded-[24px] border border-dashed border-mist/[0.16] p-6 text-[15px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2.5">
                <Users className="h-5 w-5 text-brand-200" aria-hidden /> The convener and committee for this wing will be announced soon.
              </span>
              <Link href={joinHref} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-gold hover:text-gold-soft">
                Join the wing <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
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

      {/* Events */}
      <Section id="wing-events" className="border-y border-[var(--line)] bg-grad-surface" labelledBy="events-heading">
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
            <p className="mt-8 rounded-[24px] border border-dashed border-mist/[0.16] p-6 text-[15px] text-[var(--muted)]">
              No upcoming events in this wing yet{past.length ? ` — ${past.length} past ${past.length === 1 ? 'event' : 'events'} below` : ''}. New dates are added regularly.
            </p>
          ) : (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* What the wing runs + resources */}
      <Section labelledBy="formats-heading">
        <Container size="wide" className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <Kicker>Formats</Kicker>
            <h2 id="formats-heading" className="mt-4 font-display text-[clamp(28px,3.6vw,48px)] font-medium leading-[1] tracking-[-0.04em] text-[var(--fg)]">
              What this wing <AccentText tone="gold">runs.</AccentText>
            </h2>
            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {wing.activities.map((a, i) => (
                <Reveal as="li" key={a} delay={(i % 4) * 60}>
                  <span className="flex items-center gap-3 rounded-2xl border border-mist/[0.1] bg-bg/50 px-4 py-3 text-[14px] text-[var(--fg)] transition hover:border-gold/30">
                    <Sparkles className="h-4 w-4 shrink-0 text-gold" aria-hidden /> {a}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>

          <div>
            <Kicker tone="gold">Knowledge</Kicker>
            <h2 className="mt-4 font-display text-[clamp(28px,3.6vw,48px)] font-medium leading-[1] tracking-[-0.04em] text-[var(--fg)]">
              Wing <AccentText tone="hero">resources.</AccentText>
            </h2>
            {resources.length === 0 ? (
              <p className="mt-8 rounded-[24px] border border-dashed border-mist/[0.16] p-6 text-[15px] text-[var(--muted)]">
                Resources and whitepapers from this wing will appear here.{' '}
                <Link href="/resources" className="font-semibold text-brand-200 hover:text-[var(--fg)]">
                  Browse the library
                </Link>
              </p>
            ) : (
              <ul className="mt-8 flex flex-col gap-2.5">
                {resources.map((r) => {
                  const file = r.isMembersOnly ? undefined : safeUrl(r.fileUrl);
                  return (
                    <li key={r.id} className="flex items-center gap-4 rounded-2xl border border-mist/[0.1] bg-grad-surface px-4 py-3.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-200">
                        <FileText className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-[var(--fg)]">{r.title}</span>
                        <span className="block text-[12.5px] text-[var(--muted)]">
                          {r.category} · {r.format}
                        </span>
                      </span>
                      {r.isMembersOnly ? (
                        <Link href="/join" className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-gold">
                          <Lock className="h-4 w-4" aria-hidden /> Members
                        </Link>
                      ) : file ? (
                        <a href={file} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-[var(--fg)] hover:text-brand-200">
                          {/\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|$)/i.test(file) ? <Download className="h-4 w-4" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
                          Open
                        </a>
                      ) : (
                        <span className="shrink-0 text-[12.5px] text-[var(--muted)]">Coming soon</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Container>
      </Section>

      {/* Other wings */}
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

      <CtaBand
        title="Join the"
        accent={`${wing.name.split(' ')[0]} wing.`}
        lead="Members can join as many wings as they like — pick this one when you apply."
        primary={{ href: joinHref, label: 'Join this Wing' }}
        secondary={{ href: '/wings', label: 'Explore all wings' }}
      />
    </>
  );
}
