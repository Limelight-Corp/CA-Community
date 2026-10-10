import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  HeartHandshake,
  Quote,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import type {
  CommunityEvent,
  CommunityInitiative,
  CommunityNews,
  CommunitySpeaker,
  CommunityTestimonial,
  CommunityWing,
} from '@ascend/shared';
import {
  MEMBER_JOURNEY,
  ORG_CORE_PURPOSES,
  ORG_MISSION,
  ORG_POSITIONING,
  ORG_VISION,
  WHY_JOIN,
} from '@ascend/shared';
import { Avatar, Container, Kicker, SectionHeading, AccentText } from '@ascend/ui';
import { CountUp, Countdown, Marquee, Reveal } from '../components/ui-client';
import { getItems, getSettings } from '../lib/community-store';
import { canRegister, eventSpeakers, eventWing, isUpcoming, sortByDate } from '../lib/events';
import { EventTile } from '../components/events/EventTile';
import {
  FxCard,
  Magnetic,
  RotatingWord,
  ScrollProgress,
  Spotlight,
  TiltCard,
} from '../components/home/Interactive';
import { WingsOrbit } from '../components/home/WingsOrbit';
import { JourneyScroller } from '../components/home/JourneyScroller';

export async function generateMetadata(): Promise<Metadata> {
  const s = getSettings();
  return {
    title: { absolute: `${s.siteName} — ${s.heroHeadline} ${s.heroHeadlineAccent}` },
    description: s.tagline,
    alternates: { canonical: '/' },
  };
}

const WHY_ICONS = {
  networking: Users,
  knowledge: BookOpen,
  events: CalendarDays,
  career: Briefcase,
  mentorship: HeartHandshake,
  growth: TrendingUp,
} as const;

export default function HomePage() {
  const settings = getSettings();
  const events = sortByDate(getItems<CommunityEvent>('events', true));
  const wings = getItems<CommunityWing>('wings', true).sort((a, b) => a.number - b.number);
  const speakers = getItems<CommunitySpeaker>('speakers', true);
  const news = getItems<CommunityNews>('news', true).slice(0, 3);
  const initiatives = getItems<CommunityInitiative>('initiatives', true);
  const testimonials = getItems<CommunityTestimonial>('testimonials', true);

  const upcoming = events.filter((e) => isUpcoming(e));
  const featured = [
    ...upcoming.filter((e) => e.featured),
    ...upcoming.filter((e) => !e.featured),
  ].slice(0, 3);
  const nextRegisterable = upcoming.find(canRegister);
  const registerHref = nextRegisterable ? `/events/${nextRegisterable.slug}/register` : '/events';
  // The default headline animates its verb; a custom headline from Site Settings is shown as written.
  const rotating = settings.heroHeadlineAccent.trim().toLowerCase() === 'rise together.';

  return (
    <>
      {/* ------------------------------------------------------------------ HERO */}
      <ScrollProgress />
      <Spotlight as="section" className="grain relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <div className="grid-lines absolute inset-0" aria-hidden />

        <Container size="wide" className="relative z-10 pb-20 pt-16 md:pb-28 md:pt-24 lg:pb-20 lg:pt-12">
          <div className="grid items-end gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-12">
            <div className="min-w-0">
              <Reveal>
                <Kicker tone="gold">{settings.heroEyebrow}</Kicker>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-8 font-display text-[clamp(40px,10.5vw,148px)] font-medium lg:mt-6 lg:text-[clamp(60px,6.2vw,100px)] leading-[0.88] tracking-[-0.06em] text-[var(--fg)]">
                  {settings.heroHeadline}
                  <br />
                  {rotating ? (
                    <em className="font-serif font-normal italic tracking-[-0.03em]">
                      <RotatingWord
                        words={['rise', 'learn', 'connect', 'grow', 'lead']}
                        wordClassName="text-hero-gradient pr-[0.08em]"
                      />{' '}
                      <span className="text-gold-gradient pr-3">together.</span>
                    </em>
                  ) : (
                    <AccentText tone="hero" className="pr-3">
                      {settings.heroHeadlineAccent}
                    </AccentText>
                  )}
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-8 max-w-[52ch] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-[var(--muted)]">
                  {settings.heroIntro}
                </p>
              </Reveal>
              <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <Link
                    href="/join"
                    className="group flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-brand-950 shadow-[0_16px_40px_-16px_rgb(var(--gold-rgb)/0.8)] transition hover:brightness-105"
                  >
                    Join the Community
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="h-5 w-5" aria-hidden />
                    </span>
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="/events"
                    className="flex h-14 items-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110"
                  >
                    Explore Events
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href={registerHref}
                    className="flex h-14 items-center gap-2 rounded-full border border-mist/[0.18] px-6 text-[15px] font-semibold text-[var(--fg)] transition hover:border-mist/50 hover:bg-mist/[0.04]"
                  >
                    Register Now <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Magnetic>
              </Reveal>
            </div>

            {/* Launch badge + countdown + next event */}
            <Reveal delay={200} className="relative min-w-0">
              <div className="relative mx-auto w-full max-w-[460px]">
                <TiltCard>
                  <div className="glass-panel float rounded-[32px] p-6 md:p-7">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      Countdown to launch
                    </p>
                    <Countdown
                      to={`${ORG_POSITIONING.launchDate}T00:00:00+05:30`}
                      className="mt-4"
                    />
                    {nextRegisterable && (
                      <Link
                        href={`/events/${nextRegisterable.slug}`}
                        className="group mt-6 flex items-center gap-4 rounded-2xl border border-mist/[0.1] bg-bg/40 p-4 transition hover:border-gold/40"
                      >
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-grad-primary text-white">
                          <CalendarDays className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold">
                            Next up
                          </span>
                          <span className="block truncate font-display text-[17px] font-medium text-[var(--fg)]">
                            {nextRegisterable.title}
                          </span>
                        </span>
                        <ArrowUpRight
                          className="h-5 w-5 shrink-0 text-[var(--muted)] transition group-hover:rotate-45 group-hover:text-gold"
                          aria-hidden
                        />
                      </Link>
                    )}
                  </div>
                </TiltCard>
                {/* Rotating launch badge — rendered after the card so it sits on top of the glass */}
                <div
                  className="pointer-events-none absolute -right-4 -top-14 z-20 hidden h-32 w-32 md:block"
                  aria-hidden
                >
                  <span className="absolute inset-0 rounded-full border border-gold/40 bg-bg shadow-[0_18px_40px_-18px_rgb(var(--gold-rgb)/0.7)]" />
                  <svg viewBox="0 0 200 200" className="spin-slow relative h-full w-full">
                    <defs>
                      <path
                        id="badge-circle"
                        d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"
                      />
                    </defs>
                    <text className="fill-gold font-mono text-[15px] font-medium uppercase">
                      <textPath href="#badge-circle" textLength="458" lengthAdjust="spacing">
                        Launch · 01.01.2027 · Pan-India ·
                      </textPath>
                    </text>
                  </svg>
                  <span className="absolute inset-0 m-auto grid h-11 w-11 place-items-center rounded-full bg-grad-gold text-brand-950 shadow-[0_0_24px_rgb(var(--gold-rgb)/0.6)]">
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>

        {/* Pillars ticker */}
        <div className="relative z-10 border-y border-mist/[0.08] bg-bg/40 py-5 backdrop-blur-sm">
          <Marquee duration={30} gap="2.5rem" ariaLabel="Our pillars">
            {['Learn', 'Connect', 'Grow', 'Transform', 'Thrive', 'Contribute'].map((p, i) => (
              <span
                key={p}
                className="flex shrink-0 items-center gap-10 font-display text-[clamp(28px,4vw,52px)] font-medium tracking-[-0.04em]"
              >
                <span className={i % 2 ? 'text-outline' : 'text-[var(--fg)]'}>{p}</span>
                <Sparkles className="h-6 w-6 text-gold" aria-hidden />
              </span>
            ))}
          </Marquee>
        </div>
      </Spotlight>

      {/* ------------------------------------------------------------------ ABOUT THE COMMUNITY */}
      <section className="relative py-24 md:py-32">
        <Container size="wide">
          <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
            <Reveal>
              <SectionHeading
                eyebrow="About the community"
                title="A stronger profession."
                accent="A brighter tomorrow."
                accentTone="gold"
                lead={ORG_POSITIONING.idea}
                size="lg"
              />
              <Link
                href="/about"
                className="group mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]"
              >
                <span className="draw-underline">More about us</span>
                <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
              </Link>
              <ul className="mt-10 grid gap-2 sm:grid-cols-2">
                {ORG_CORE_PURPOSES.map((p, i) => (
                  <li
                    key={p.key}
                    className="group flex items-start gap-3 rounded-2xl border border-mist/[0.08] p-4 transition duration-500 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/[0.04]"
                  >
                    <span className="font-mono text-[11px] text-gold transition group-hover:scale-125">
                      0{i + 1}
                    </span>
                    <span>
                      <span className="block font-display text-[18px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                        {p.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-[var(--muted)]">
                        {p.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              <Reveal delay={60} className="sm:col-span-2">
                <FxCard className="glass-panel h-full rounded-[28px] p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                    Our vision
                  </p>
                  <p className="mt-4 font-display text-[clamp(20px,2vw,26px)] leading-snug tracking-[-0.02em] text-[var(--fg)]">
                    {ORG_VISION}
                  </p>
                </FxCard>
              </Reveal>
              <Reveal delay={120} className="sm:col-span-2">
                <FxCard className="glass-panel h-full rounded-[28px] p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-200">
                    Our mission
                  </p>
                  <p className="mt-4 text-[16.5px] leading-relaxed text-[var(--muted)]">
                    {ORG_MISSION}
                  </p>
                </FxCard>
              </Reveal>
              {[
                { k: 10, l: 'Professional wings' },
                { k: 100, l: 'Proposed activity formats' },
                { k: 6, l: 'Community structures' },
                { k: 9, l: 'Steps from member to leader' },
              ].map((s, i) => (
                <Reveal key={s.l} delay={160 + i * 60}>
                  <FxCard className="h-full overflow-hidden rounded-[28px] border border-mist/[0.08] bg-grad-surface p-6">
                    <CountUp
                      value={s.k}
                      className="block font-display text-[64px] font-semibold leading-none tracking-[-0.05em] text-white [text-shadow:0_0_30px_rgb(var(--lime-rgb)/0.5)]"
                    />
                    <span className="mt-3 block text-[14px] text-[var(--muted)]">{s.l}</span>
                    <span
                      aria-hidden
                      className="fx-ghost absolute -bottom-10 -right-4 h-28 w-28 rounded-full bg-gold/20 opacity-60 blur-2xl"
                    />
                  </FxCard>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ UPCOMING EVENTS */}
      <section className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
        <div
          className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-brand-500/20 blur-[120px]"
          aria-hidden
        />
        <Container size="wide" className="relative">
          <Reveal>
            <SectionHeading
              eyebrow="Upcoming events"
              title="Learn something."
              accent="Meet someone."
              size="lg"
              action={
                <Link
                  href="/events"
                  className="group flex h-12 items-center gap-3 rounded-full border border-mist/[0.16] pl-5 pr-1.5 text-[14px] font-semibold text-[var(--fg)] transition hover:border-mist/50"
                >
                  All events
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-mist/[0.08] transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              }
            />
          </Reveal>

          {featured.length > 0 ? (
            <div className="-mx-5 mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
              {featured.map((e, i) => (
                <Reveal key={e.id} delay={i * 90} className="w-[86%] shrink-0 snap-start md:w-auto">
                  <FxCard className="h-full rounded-[28px]" max={5}>
                    <EventTile
                      event={e}
                      wing={eventWing(e, wings)}
                      speakers={eventSpeakers(e, speakers)}
                      className="h-full"
                    />
                  </FxCard>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-14 text-[var(--muted)]">
              New events are being scheduled — check back soon.
            </p>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------------ WHY JOIN US (bento) */}
      <section className="relative border-t border-[var(--line)] py-24 md:py-32">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              eyebrow="Why join us"
              title="Six reasons to"
              accent="belong here."
              accentTone="gold"
              size="lg"
              align="center"
              className="mx-auto"
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 auto-rows-[minmax(170px,auto)] gap-3 md:mt-16 md:auto-rows-[minmax(210px,auto)] md:grid-cols-4 md:gap-4">
            {WHY_JOIN.slice(0, 5).map((w, i) => {
              const Icon = WHY_ICONS[w.key];
              const hero = i === 0;
              return (
                <Reveal
                  key={w.key}
                  delay={i * 70}
                  className={hero ? 'col-span-2 md:row-span-2' : ''}
                >
                  <FxCard
                    className={`flex h-full flex-col overflow-hidden rounded-[24px] border p-5 md:rounded-[28px] md:p-7 ${hero ? 'border-transparent bg-grad-primary' : 'border-mist/[0.08] bg-grad-surface'}`}
                  >
                    {hero && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/30 blur-[90px]"
                      />
                    )}
                    <span
                      className={`fx-icon relative grid place-items-center rounded-2xl ${hero ? 'h-14 w-14 bg-white/15 text-white md:h-16 md:w-16' : 'h-10 w-10 bg-brand-500/15 text-brand-200 md:h-12 md:w-12'}`}
                    >
                      <Icon className={hero ? 'h-8 w-8' : 'h-6 w-6'} aria-hidden />
                    </span>
                    <h3
                      className={`relative font-display font-medium tracking-[-0.03em] ${hero ? 'mt-auto pt-16 text-[clamp(40px,5vw,72px)] leading-[0.92] text-white md:pt-24' : 'mt-auto pt-6 text-[19px] leading-tight text-[var(--fg)] md:pt-8 md:text-[26px]'}`}
                    >
                      {w.title}
                    </h3>
                    <p
                      className={`relative mt-3 max-w-[44ch] leading-relaxed ${hero ? 'text-[16px] text-white/80 md:text-[17px]' : 'text-[12.5px] text-[var(--muted)] md:text-[15px]'}`}
                    >
                      {w.text}
                    </p>
                    <span
                      aria-hidden
                      className={`fx-ghost absolute -bottom-6 -right-2 font-display font-semibold leading-none tracking-[-0.06em] opacity-70 ${hero ? 'text-[160px] text-white/10 md:text-[220px]' : 'text-[90px] text-mist/[0.05] md:text-[140px]'}`}
                    >
                      0{i + 1}
                    </span>
                  </FxCard>
                </Reveal>
              );
            })}
            {WHY_JOIN[5] && (
              <Reveal delay={350} className="col-span-2 md:col-span-4">
                <FxCard
                  max={3}
                  className="grain flex h-full flex-col gap-6 overflow-hidden rounded-[28px] border border-gold/25 bg-gradient-to-r from-brand-900 via-brand-950 to-brand-900 p-7 md:flex-row md:items-center md:justify-between md:p-10"
                >
                  <div className="relative flex items-center gap-5">
                    <span className="fx-icon grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-grad-gold text-brand-950">
                      <TrendingUp className="h-7 w-7" aria-hidden />
                    </span>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                        06 · {WHY_JOIN[5].title}
                      </span>
                      <p className="mt-1 font-display text-[clamp(22px,2.6vw,34px)] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)]">
                        {WHY_JOIN[5].text}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/join"
                    className="group/cta relative inline-flex h-14 shrink-0 items-center gap-4 self-start rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-brand-950 transition hover:brightness-105 md:self-auto"
                  >
                    Join the community
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover/cta:rotate-45">
                      <ArrowUpRight className="h-5 w-5" aria-hidden />
                    </span>
                  </Link>
                </FxCard>
              </Reveal>
            )}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ MEMBER JOURNEY (pinned horizontal scroll) */}
      <section className="relative border-t border-[var(--line)]">
        <JourneyScroller
          steps={MEMBER_JOURNEY}
          heading={
            <SectionHeading
              eyebrow="The member journey"
              title="From first hello to"
              accent="leading the room."
              accentTone="gold"
              size="lg"
            />
          }
        />
      </section>

      {/* ------------------------------------------------------------------ INITIATIVES */}
      {initiatives.length > 0 && (
        <section className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                eyebrow="Featured & upcoming initiatives"
                title="The road to"
                accent="launch day."
                size="lg"
              />
            </Reveal>
            <ol className="relative mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <span
                aria-hidden
                className="absolute left-0 right-0 top-[27px] hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 lg:block"
              />
              {initiatives.map((it, i) => (
                <Reveal as="li" key={it.id} delay={i * 90} className="relative">
                  <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-bg font-display text-[18px] font-semibold text-gold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <FxCard className="mt-6 rounded-[24px] border border-mist/[0.08] bg-grad-surface p-6">
                    {it.tag && (
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
                        {it.tag}
                      </p>
                    )}
                    <h3 className="mt-3 font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                      {it.title}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--muted)]">
                      {it.description}
                    </p>
                    {it.ctaUrl && (
                      <Link
                        href={it.ctaUrl}
                        className="group mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-white"
                      >
                        {it.ctaLabel || 'Learn more'}
                        <ArrowUpRight
                          className="h-4 w-4 transition group-hover:rotate-45"
                          aria-hidden
                        />
                      </Link>
                    )}
                  </FxCard>
                </Reveal>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------------ 10 WINGS ORBIT */}
      <section className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
        <Container size="wide" className="relative">
          <Reveal>
            <SectionHeading
              eyebrow="10 professional wings"
              title="Ten wings."
              accent="One community."
              size="lg"
              align="center"
              className="mx-auto"
              lead="From tax to AI, leadership to wellness — join as many wings as you like."
            />
          </Reveal>
          <Reveal delay={120} className="mt-14">
            <WingsOrbit
              wings={wings.map((w) => ({
                id: w.id,
                number: w.number,
                name: w.name,
                color: w.color,
                tags: w.tags,
                activities: w.activities,
              }))}
            />
          </Reveal>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ LATEST NEWS */}
      {news.length > 0 && (
        <section className="relative border-t border-[var(--line)] py-24 md:py-32">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                eyebrow="Latest updates"
                title="What's"
                accent="new."
                size="lg"
                action={
                  <Link
                    href="/news"
                    className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]"
                  >
                    <span className="draw-underline">All news & updates</span>
                    <ArrowUpRight
                      className="h-4 w-4 transition group-hover:rotate-45"
                      aria-hidden
                    />
                  </Link>
                }
              />
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {news.map((n, i) => (
                <Reveal key={n.id} delay={i * 80}>
                  <FxCard className="h-full rounded-[28px]" max={5}>
                    <Link
                      href={`/news/${n.slug}`}
                      className="shine group flex h-full flex-col overflow-hidden rounded-[28px] border border-mist/[0.08] bg-grad-surface"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        {n.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={n.coverImageUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                            style={{
                              background: `radial-gradient(80% 90% at ${20 + i * 30}% 10%, rgb(var(--lime-rgb) / 0.55), transparent 60%), radial-gradient(60% 70% at 100% 100%, rgb(var(--gold-rgb) / 0.3), transparent 60%), var(--surface-hi)`,
                            }}
                          />
                        )}
                        <span className="absolute left-4 top-4 rounded-full bg-bg/80 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-gold backdrop-blur-md">
                          {n.category}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-6">
                        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
                          {n.date}
                          {n.author ? ` · ${n.author}` : ''}
                        </p>
                        <h3 className="font-display text-[21px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)] group-hover:text-white">
                          {n.title}
                        </h3>
                        <p className="line-clamp-3 text-[14.5px] leading-relaxed text-[var(--muted)]">
                          {n.summary}
                        </p>
                      </div>
                    </Link>
                  </FxCard>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------------ TESTIMONIALS (shown once added in the admin) */}
      {testimonials.length > 0 && (
        <section className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                eyebrow="Member voices"
                title="In their"
                accent="words."
                accentTone="gold"
                size="lg"
              />
            </Reveal>
          </Container>
          <div className="mt-14">
            <Marquee
              duration={Math.max(30, testimonials.length * 12)}
              gap="1.25rem"
              ariaLabel="Member testimonials"
            >
              {testimonials.map((t) => (
                <figure
                  key={t.id}
                  className="glass-panel flex w-[min(420px,80vw)] shrink-0 flex-col gap-6 rounded-[28px] p-7"
                >
                  <Quote className="h-8 w-8 text-gold" aria-hidden />
                  <blockquote className="text-[17px] leading-relaxed text-[var(--fg)]">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-auto flex items-center gap-3">
                    <Avatar name={t.name} src={t.photoUrl} size={44} />
                    <span>
                      <span className="block font-medium text-[var(--fg)]">{t.name}</span>
                      {t.designation && (
                        <span className="block text-[13px] text-[var(--muted)]">
                          {t.designation}
                        </span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </Marquee>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ CALL TO ACTION */}
      <section className="relative px-5 pb-24 md:px-8 md:pb-32">
        <Reveal className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-grad-primary px-6 py-20 text-center md:px-16 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gold/40 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-300/50 blur-[110px]"
          />
          <p className="relative font-mono text-[12px] uppercase tracking-[0.16em] text-gold-soft">
            {ORG_POSITIONING.launchLabel}
          </p>
          <h2 className="relative mx-auto mt-6 max-w-[16ch] font-display text-[clamp(44px,7.5vw,112px)] font-medium leading-[0.92] tracking-[-0.055em] text-white">
            Your profession.{' '}
            <em className="font-serif font-normal italic text-gold-gradient">Your people.</em>
          </h2>
          <div className="relative mt-12 flex flex-wrap justify-center gap-3">
            <Link
              href="/join"
              className="group flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-brand-950 transition hover:brightness-105"
            >
              Join the community
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </span>
            </Link>
            <Link
              href={registerHref}
              className="flex h-14 items-center rounded-full border border-white/40 px-6 text-[15px] font-semibold text-white transition hover:bg-white/10"
            >
              Register for an event
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
