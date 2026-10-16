import React from 'react';
import type { Metadata } from 'next';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { EVENTS_PAGE_CONTENT } from '@ascend/shared';
import { AccentText, Container, Kicker } from '@ascend/ui';
// Preserved imports for commented out stats/banner widgets:
// import { Countdown } from '../../components/ui-client';
// import { canRegister, formatEventDate, isUpcoming, locationLabel, sortByDate } from '../../lib/events';
// import { eventInstants, toIstIso } from '../../components/events/event-time';
import { getItems } from '../../lib/community-store';
import { CategoryCards } from '../../components/events/CategoryCards';
import { EventsExplorer } from '../../components/events/EventsExplorer';
import { siteTaxonomy } from '../../lib/taxonomy';

export async function generateMetadata(): Promise<Metadata> {
  const title = EVENTS_PAGE_CONTENT.seoTitle;
  const description =
    'Discover CA seminars, workshops, conferences and networking events with EAGLE 2.0. Explore professional learning opportunities and event registration details.';
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/events' },
    openGraph: { title, description, url: '/events' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
}) {
  const sp = await searchParams;
  const events = await getItems<CommunityEvent>('events', true);
  const wings = [...(await getItems<CommunityWing>('wings', true))].sort((a, b) => a.number - b.number);
  const speakers = await getItems<CommunitySpeaker>('speakers', true);

  // Dynamic values preserved in comments below per blueprint instructions:
  // const upcoming = sortByDate(events.filter((e) => isUpcoming(e)));
  // const next = upcoming.find((e) => canRegister(e)) ?? upcoming[0];
  // const cityCount = new Set(events.filter((e) => e.mode === 'Offline' && e.city).map((e) => e.city.trim().toLowerCase())).size;
  // const freeCount = upcoming.filter((e) => !(e.fee > 0)).length;
  const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  return (
    <>
      {/* 5. Events Page Hero */}
      <section className="grain relative overflow-hidden border-b border-mist/[0.08]">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden />
        <Container size="wide" className="relative z-10 pb-14 pt-14 md:pb-20 md:pt-20">
          <div className="flex max-w-4xl flex-col gap-6">
            <Kicker tone="gold">
              <span className="live-dot !bg-gold" aria-hidden /> {EVENTS_PAGE_CONTENT.hero.kicker}
            </Kicker>
            <h1 className="font-display text-[clamp(38px,5.4vw,84px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
              Events That Connect{' '}
              <AccentText tone="hero">Knowledge with Opportunity.</AccentText>
            </h1>

            <div className="flex max-w-[46ch] flex-col gap-4 text-[clamp(16px,1.4vw,19px)] leading-relaxed text-[var(--muted)]">
              {EVENTS_PAGE_CONTENT.hero.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </div>

          {/* Stats strip counter preserved (commented out per Blueprint as not present in Word doc):
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
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
          */}

          {/* Next up event banner preserved (commented out per Blueprint as not present in Word doc):
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
          */}
        </Container>
      </section>

      {/* 5.3 Explore Events by Category */}
      <section className="border-b border-mist/[0.08] py-14 md:py-20">
        <Container size="wide">
          <div className="flex flex-col gap-3">
            <Kicker tone="gold">Event Categories</Kicker>
            <h2 className="font-display text-[clamp(32px,4vw,56px)] font-medium leading-[1] tracking-[-0.04em] text-[var(--fg)]">
              Explore Events by <AccentText tone="hero">Category</AccentText>
            </h2>
          </div>

          <CategoryCards />
        </Container>
      </section>

      {/* 5.4 Make Every Interaction Count */}
      <section className="relative overflow-hidden border-b border-mist/[0.08] py-14 md:py-18">
        <div className="aurora opacity-30" aria-hidden>
          <i />
        </div>
        <Container size="wide" className="relative z-10">
          <div className="glass-panel relative overflow-hidden rounded-[28px] border border-mist/[0.12] p-8 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr] lg:items-center">
              <div>
                <Kicker tone="gold">{EVENTS_PAGE_CONTENT.interactionSection.subtitle}</Kicker>
                <h2 className="mt-3 font-display text-[clamp(28px,3.4vw,46px)] font-medium leading-[1.05] tracking-[-0.035em] text-[var(--fg)]">
                  {EVENTS_PAGE_CONTENT.interactionSection.heading}
                </h2>
                <p className="mt-4 max-w-[62ch] text-[clamp(15px,1.2vw,17.5px)] leading-relaxed text-[var(--muted)]">
                  {EVENTS_PAGE_CONTENT.interactionSection.copy}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:justify-end">
                {['Discover', 'Register', 'Participate', 'Grow'].map((step, sIdx) => (
                  <div
                    key={step}
                    className="flex items-center gap-2.5 rounded-2xl border border-mist/[0.12] bg-brand-500/10 px-4 py-3"
                  >
                    <span className="font-mono text-[11px] font-semibold text-gold">
                      {String(sIdx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-[15px] font-medium tracking-[-0.01em] text-[var(--fg)]">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Events Explorer Calendar */}
      <section id="events-calendar" className="py-14 md:py-20">
        <Container size="wide">
          <EventsExplorer
            events={events}
            wings={wings}
            speakers={speakers}
            categories={await siteTaxonomy('eventCategories', events.map((e) => e.category))}
            initialCategory={pick(sp.category)}
            initialQuery={pick(sp.q)}
          />
        </Container>
      </section>
    </>
  );
}

