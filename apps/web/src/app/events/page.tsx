import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { AccentText, Container, Kicker } from '@ascend/ui';
import { Countdown, Marquee } from '../../components/ui-client';
import { getItems, getSettings } from '../../lib/community-store';
import { canRegister, formatEventDate, isUpcoming, locationLabel, sortByDate } from '../../lib/events';
import { EventsExplorer } from '../../components/events/EventsExplorer';
import { eventInstants, toIstIso } from '../../components/events/event-time';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  const description = `Summits, masterclasses, clinics and meetups from ${siteName} — find an event by date, city, type or price and register in a couple of minutes.`;
  return {
    title: 'Events',
    description,
    alternates: { canonical: '/events' },
    openGraph: { title: `Events · ${siteName}`, description, url: '/events' },
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const events = getItems<CommunityEvent>('events', true);
  const wings = getItems<CommunityWing>('wings', true);
  const speakers = getItems<CommunitySpeaker>('speakers', true);

  const upcoming = sortByDate(events.filter((e) => isUpcoming(e)));
  const next = upcoming.find((e) => canRegister(e)) ?? upcoming[0];
  const cityCount = new Set(events.filter((e) => e.mode === 'Offline' && e.city).map((e) => e.city.trim().toLowerCase())).size;
  const freeCount = upcoming.filter((e) => !(e.fee > 0)).length;
  const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden border-b border-mist/[0.08]">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <Container size="wide" className="relative z-10 pb-14 pt-14 md:pb-20 md:pt-20">
          <Kicker tone="gold">
            <span className="live-dot !bg-gold" aria-hidden /> Events calendar
          </Kicker>
          <h1 className="mt-7 font-display text-[clamp(52px,10.5vw,148px)] font-medium leading-[0.86] tracking-[-0.06em] text-[var(--fg)]">
            Learn <span className="text-outline">something.</span>
            <br />
            <AccentText tone="hero">Meet someone.</AccentText>
          </h1>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <p className="max-w-[52ch] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-[var(--muted)]">
              Summits, masterclasses, clinics and meetups across all ten wings. Filter by date, city or type and lock your
              seat in a couple of minutes.
            </p>
            <dl className="flex flex-wrap gap-x-10 gap-y-4">
              {[
                { v: upcoming.length, l: 'Upcoming' },
                { v: cityCount, l: cityCount === 1 ? 'City' : 'Cities' },
                { v: freeCount, l: 'Free to attend' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)]">{s.l}</dt>
                  <dd className="font-display text-[44px] font-medium leading-none tracking-[-0.04em] text-[var(--fg)] tabular-nums">
                    {String(s.v).padStart(2, '0')}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {next && (
            <Link
              href={`/events/${next.slug}`}
              className="shine group mt-12 flex flex-col gap-5 rounded-[28px] border border-mist/[0.12] bg-grad-surface p-5 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 md:flex-row md:items-center md:justify-between md:p-6"
            >
              <div className="min-w-0">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Next up</span>
                <p className="mt-2 truncate font-display text-[clamp(22px,2.6vw,32px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
                  {next.title}
                </p>
                <p className="mt-1 text-[14px] text-[var(--muted)]">
                  {formatEventDate(next, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {next.time} ·{' '}
                  {locationLabel(next)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Countdown to={toIstIso(eventInstants(next).start)} className="[&>div]:min-w-[56px]" />
                <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-grad-primary text-white transition-transform duration-300 group-hover:rotate-45 sm:grid">
                  <ArrowUpRight className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </Link>
          )}
        </Container>
      </section>

      {wings.length > 0 && (
        <div className="border-b border-mist/[0.08] py-4">
          <Marquee ariaLabel="Our ten wings" duration={50}>
            {wings.map((w) => (
              <span key={w.id} className="inline-flex items-center gap-3 font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: w.color }} aria-hidden />
                {w.name}
              </span>
            ))}
          </Marquee>
        </div>
      )}

      <section className="py-14 md:py-20">
        <Container size="wide">
          <EventsExplorer
            events={events}
            wings={wings}
            speakers={speakers}
            initialCategory={pick(sp.category)}
            initialQuery={pick(sp.q)}
          />
        </Container>
      </section>
    </>
  );
}
