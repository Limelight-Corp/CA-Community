import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  CalendarDays,
  Heart,
  HeartHandshake,
  Quote,
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
import { AccentText, Avatar, Container, Kicker, SectionHeading, cn } from '@ascend/ui';
import { CountUp, Countdown, Reveal } from '../components/ui-client';
import { getItems, getSettings } from '../lib/community-store';
import { safeUrl } from '../lib/content';
import { canRegister, eventSpeakers, eventWing, isUpcoming, sortByDate } from '../lib/events';
import { EventTile } from '../components/events/EventTile';
import {
  FxCard,
  Magnetic,
  ScrollProgress,
  Spotlight,
  TiltCard,
} from '../components/home/Interactive';
import { WingsOrbit } from '../components/home/WingsOrbit';
import { JourneyScroller } from '../components/home/JourneyScroller';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: 'EAGLE 2.0 | CA Professional Community India' },
    description: 'Discover EAGLE 2.0, a professional community for Chartered Accountants, CA students and allied professionals in India. Learn, connect, grow and contribute.',
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
  wellness: Heart,
} as const;

/** Blueprint Section 2.9: Featured Initiatives proposed by EAGLE 2.0 */
const DEFAULT_INITIATIVES: CommunityInitiative[] = [
  {
    id: 'init-1',
    title: 'Technical Knowledge Series',
    tag: 'Knowledge & Regulatory',
    description: 'Technical seminars, masterclasses, case-law clinics and regulatory updates covering Income Tax, GST, International Tax, Corporate Law and Audit Standards.',
    ctaLabel: 'Explore technical updates',
    ctaUrl: '/wings',
    isPublished: true,
  },
  {
    id: 'init-2',
    title: 'Career and Leadership Conversations',
    tag: 'Leadership & Careers',
    description: 'Interactive dialogues and sessions with industry CFOs, seasoned partners, entrepreneurs and practice leaders on career progression and leadership development.',
    ctaLabel: 'Leadership dialogues',
    ctaUrl: '/about',
    isPublished: true,
  },
  {
    id: 'init-3',
    title: 'AI and Future-Ready CA',
    tag: 'Technology & AI',
    description: 'Hands-on awareness sessions, practical labs and frameworks exploring artificial intelligence, workflow automation and emerging digital tools transforming accounting.',
    ctaLabel: 'Explore AI sessions',
    ctaUrl: '/events',
    isPublished: true,
  },
  {
    id: 'init-4',
    title: 'Mentorship and Peer Learning',
    tag: 'Mentorship',
    description: 'Structured programmes connecting seasoned practitioners and senior leaders with young Chartered Accountants and CA students for continuous guidance.',
    ctaLabel: 'Join mentorship',
    ctaUrl: '/join',
    isPublished: true,
  },
  {
    id: 'init-5',
    title: "Women Professionals' Network",
    tag: 'Women CA Network',
    description: 'Dedicated initiatives, leadership circles, networking meetups and professional development forums for women Chartered Accountants across cities.',
    ctaLabel: 'Connect with network',
    ctaUrl: '/wings',
    isPublished: true,
  },
  {
    id: 'init-6',
    title: 'Community and Social Impact',
    tag: 'Social Impact',
    description: 'Financial literacy programmes, student support, pro bono advisory and social initiatives creating positive, lasting value for the profession and society.',
    ctaLabel: 'View impact projects',
    ctaUrl: '/about',
    isPublished: true,
  },
  {
    id: 'init-7',
    title: 'Sports and Wellness Activities',
    tag: 'Sports & Wellness',
    description: 'Annual cricket leagues, badminton tournaments, fitness challenges, mental health awareness and work-life balance sessions for professionals.',
    ctaLabel: 'Explore wellness events',
    ctaUrl: '/events',
    isPublished: true,
  },
  {
    id: 'init-8',
    title: 'Global Connections and Industry Dialogues',
    tag: 'Global Perspective',
    description: 'Cross-border professional networking, international reporting, study tours and dialogues connecting Indian CAs with global opportunities.',
    ctaLabel: 'Explore global wing',
    ctaUrl: '/wings',
    isPublished: true,
  },
];

/** Default member testimonials matching Blueprint Section 2.11 */
const DEFAULT_TESTIMONIALS: CommunityTestimonial[] = [
  {
    id: 'test-1',
    name: 'CA Rajesh Sharma',
    designation: 'Senior Partner, Direct Tax & Corporate Advisory · New Delhi',
    quote: 'EAGLE 2.0 brings together the best minds in the profession. The focused wing structure and technical masterclasses provide practical, real-world clarity on complex regulatory shifts that every practicing CA needs.',
    isPublished: true,
  },
  {
    id: 'test-2',
    name: 'CA Sneha Patel',
    designation: 'Managing Partner · Women CA Network Lead · Mumbai',
    quote: 'Being part of this community has unlocked incredible peer collaborations and leadership opportunities. The focus on mentorship, women professionals and wellness makes EAGLE 2.0 truly forward-looking.',
    isPublished: true,
  },
  {
    id: 'test-3',
    name: 'CA Amit Verma',
    designation: 'Founder, AI & Financial Automation Practice · Bengaluru',
    quote: 'The emphasis on AI, emerging technology and continuous learning is what sets EAGLE 2.0 apart. It is an indispensable platform for any professional aiming to build a future-ready practice.',
    isPublished: true,
  },
];

const UPCOMING_EVENT_CATEGORIES: { label: string; category: string }[] = [
  { label: 'Technical seminars and regulatory updates', category: 'Seminars and technical updates' },
  { label: 'Workshops and practical learning sessions', category: 'Workshops and masterclasses' },
  { label: 'Industry and leadership conversations', category: 'Industry and leadership conversations' },
  { label: 'AI, technology and automation sessions', category: 'AI, technology and automation' },
  { label: 'Career development and mentorship', category: 'Career development and mentorship' },
  { label: 'Networking and community meetups', category: 'Networking and community meetups' },
  { label: 'Sports, wellness and social impact initiatives', category: 'Sports, wellness and social impact' },
];

export default async function HomePage() {
  const settings = await getSettings();
  const heroImage = safeUrl(settings.heroImageUrl);
  const events = sortByDate(await getItems<CommunityEvent>('events', true));
  const wings = [...(await getItems<CommunityWing>('wings', true))].sort((a, b) => a.number - b.number);
  const speakers = await getItems<CommunitySpeaker>('speakers', true);
  const news = (await getItems<CommunityNews>('news', true)).slice(0, 3);
  const storeInitiatives = await getItems<CommunityInitiative>('initiatives', true);
  const initiatives = storeInitiatives.length >= 8 ? storeInitiatives : DEFAULT_INITIATIVES;
  const storeTestimonials = await getItems<CommunityTestimonial>('testimonials', true);
  const testimonials = storeTestimonials.length > 0 ? storeTestimonials : DEFAULT_TESTIMONIALS;

  const upcoming = events.filter((e) => isUpcoming(e));
  const featured = [
    ...upcoming.filter((e) => e.featured),
    ...upcoming.filter((e) => !e.featured),
  ].slice(0, 3);
  const nextRegisterable = upcoming.find(canRegister);
  const registerHref = nextRegisterable ? `/events/${nextRegisterable.slug}/register` : '/events';

  return (
    <>
      {/* ------------------------------------------------------------------ HERO */}
      <ScrollProgress />
      <Spotlight as="section" className="grain relative -mt-[72px] overflow-hidden pt-[72px]">
        {heroImage && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="h-full w-full object-cover opacity-35" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/85 to-bg/40" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />
          </div>
        )}
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <div className="grid-lines absolute inset-0" aria-hidden />

        <Container size="wide" className="relative z-10 pb-14 pt-12 md:pb-20 md:pt-16 lg:pb-16 lg:pt-10">
          <div className="grid items-end gap-14 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-12">
            <div className="min-w-0">
              <Reveal>
                <Kicker tone="gold">EAGLE 2.0 · नई सोच, नई उड़ान | Nayi Soch, Nayi Udaan</Kicker>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-8 font-display text-[clamp(38px,8.5vw,110px)] font-medium lg:mt-6 lg:text-[clamp(50px,5.2vw,82px)] leading-[0.92] tracking-[-0.05em] text-[var(--fg)]">
                  EAGLE 2.0{' '}
                  <span className="block mt-1 sm:mt-2">A New Era of</span>{' '}
                  <em className="font-serif font-normal italic tracking-[-0.03em]">
                    <span className="text-hero-gradient pr-2">Professional</span>
                    <span className="text-gold-gradient pr-3">Community.</span>
                  </em>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-[54ch] text-[clamp(16px,1.4vw,19px)] font-medium leading-relaxed text-[var(--fg)]">
                  A Pan-India professional community bringing together Chartered Accountants, CA students and allied professionals to learn, connect, grow, transform, thrive and contribute.
                </p>
                <p className="mt-4 max-w-[54ch] text-[clamp(15px,1.3vw,17px)] leading-relaxed text-[var(--muted)]">
                  EAGLE 2.0 is built on a simple belief: the profession grows stronger when its people grow together. Through knowledge sharing, meaningful connections, professional initiatives and collaborative opportunities, we aim to help build a stronger, more connected and future-ready CA community.
                </p>
                <p className="mt-3 font-medium text-gold text-[15px]">
                  Join the movement. Shape the future. Grow together.
                </p>
              </Reveal>
              <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-3">
                <Magnetic>
                  <Link
                    href="/join"
                    className="group flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-[#2A1A0E] shadow-[0_16px_40px_-16px_rgb(var(--gold-rgb)/0.8)] transition hover:brightness-105"
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
                    Explore Upcoming Events
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="/wings"
                    className="flex h-14 items-center gap-2 rounded-full border border-mist/[0.18] px-6 text-[15px] font-semibold text-[var(--fg)] transition hover:border-mist/50 hover:bg-mist/[0.04]"
                  >
                    Discover Our Wings <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Magnetic>
              </Reveal>
            </div>

            {/* E Group emblem (static 3D look) + countdown + next event */}
            <Reveal delay={200} className="relative min-w-0">
              <div className="relative mx-auto w-full max-w-[460px]">
                <figure className="emblem-3d mx-auto mb-10 w-[min(420px,86%)] md:mb-12">
                  <Image
                    src="/brand/egroup-logo.png"
                    alt="E Group emblem"
                    width={640}
                    height={331}
                    priority
                    className="emblem-3d__img h-auto w-full"
                  />
                </figure>
                <TiltCard>
                  <div className="glass-panel rounded-[32px] p-6 md:p-7">
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
              </div>
            </Reveal>
          </div>
        </Container>
      </Spotlight>

      {/* ------------------------------------------------------------------ ABOUT THE COMMUNITY */}
      <section className="relative py-12 md:py-16">
        <Container size="wide">
          {/* Top Section: About Text (Left) + 6 Core Purpose Cards (Right) */}
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-6">
              <Reveal>
                <div className="flex flex-col gap-3.5">
                  <Kicker tone="gold">About EAGLE 2.0</Kicker>
                  <h2 className="font-display text-[clamp(28px,3vw,44px)] font-medium leading-[1.08] tracking-[-0.035em] text-[var(--fg)]">
                    <span className="block">A stronger profession.</span>
                    <span className="block mt-0.5">
                      <AccentText tone="gold">A brighter tomorrow.</AccentText>
                    </span>
                  </h2>
                  <p className="text-[clamp(15px,1.2vw,16.5px)] leading-relaxed text-[var(--muted)]">
                    EAGLE 2.0 is a professional community envisioned to bring Chartered Accountants, young professionals, CA students and allied professionals closer through shared learning, meaningful networking and collective action.
                  </p>
                </div>
                <div className="mt-4 flex flex-col gap-3 text-[14.5px] leading-relaxed text-[var(--muted)]">
                  <p>
                    We believe professional growth extends beyond qualifications and designations. It comes from the people we learn from, the opportunities we create, the ideas we exchange and the impact we make together.
                  </p>
                  <p>
                    EAGLE 2.0 seeks to create an inclusive and dynamic platform where professionals can discover new possibilities, exchange perspectives across industries and cities, develop leadership capabilities and contribute to the future of the profession.
                  </p>
                  <p className="font-medium text-[var(--fg)]">
                    Our purpose is simple: to turn individual potential into collective progress.
                  </p>
                </div>
                <Link
                  href="/about"
                  className="group mt-6 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]"
                >
                  <span className="draw-underline">Discover Our Vision and Mission</span>
                  <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
                </Link>
              </Reveal>
            </div>

            {/* Right side: 6 Core Purpose Cards */}
            <div className="lg:col-span-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {ORG_CORE_PURPOSES.map((p, i) => (
                  <Reveal as="li" key={p.key} delay={i * 60} className="h-full">
                    <div className="group flex h-full flex-col justify-between rounded-2xl border border-mist/[0.08] bg-grad-surface p-4 transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-gold/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] font-semibold tracking-wider text-gold transition group-hover:scale-110">
                          0{i + 1}
                        </span>
                        <span className="font-display text-[17px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                          {p.title}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)]">
                        {p.text}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section: Vision & Mission (Side by Side) */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Reveal delay={60}>
              <FxCard className="glass-panel h-full rounded-[22px] p-5 md:p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                  Our vision
                </p>
                <p className="mt-2.5 text-[clamp(15px,1.35vw,17.5px)] font-medium leading-relaxed text-[var(--fg)]">
                  {ORG_VISION}
                </p>
              </FxCard>
            </Reveal>
            <Reveal delay={120}>
              <FxCard className="glass-panel h-full rounded-[22px] p-5 md:p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                  Our mission
                </p>
                <p className="mt-2.5 text-[clamp(15px,1.35vw,17.5px)] font-medium leading-relaxed text-[var(--fg)]">
                  {ORG_MISSION}
                </p>
              </FxCard>
            </Reveal>
          </div>

          {/* 4 Stat Counters in a Clean 4-Column Strip */}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: 10, l: 'Professional wings' },
              { k: 100, l: 'Proposed activity formats' },
              { k: 6, l: 'Community structures' },
              { k: 9, l: 'Steps from member to leader' },
            ].map((s, i) => (
              <Reveal key={s.l} delay={160 + i * 50}>
                <FxCard className="flex flex-col items-center justify-center text-center overflow-hidden rounded-[20px] border border-mist/[0.08] bg-grad-surface py-4 px-3 sm:py-5 sm:px-4 transition hover:border-gold/30">
                  <CountUp
                    value={s.k}
                    className="block font-display text-[clamp(32px,3vw,42px)] font-semibold leading-none tracking-[-0.04em] text-[var(--fg)] text-center"
                  />
                  <span className="mt-1.5 block text-[12.5px] font-medium text-[var(--muted)] text-center">{s.l}</span>
                  <span
                    aria-hidden
                    className="fx-ghost absolute -bottom-8 -right-4 h-20 w-20 rounded-full bg-gold/15 opacity-40 blur-xl"
                  />
                </FxCard>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ UPCOMING EVENTS */}
      <section className="relative overflow-hidden border-t border-[var(--line)] py-10 md:py-14">
        <div
          className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-brand-500/20 blur-[120px]"
          aria-hidden
        />
        <Container size="wide" className="relative">
          <Reveal>
            <div className="flex max-w-5xl flex-col gap-4">
              <Kicker tone="gold">Upcoming events</Kicker>
              <h2 className="font-display text-[clamp(28px,3.8vw,56px)] font-medium leading-[1.05] tracking-[-0.035em] text-[var(--fg)]">
                <span className="block">
                  Learn something.{' '}
                  <AccentText tone="hero">Meet someone.</AccentText>
                </span>
                <span className="block mt-0.5">
                  <AccentText tone="hero">Discover what&apos;s possible.</AccentText>
                </span>
              </h2>
              <div className="mt-1 flex max-w-[76ch] flex-col gap-2.5 text-[clamp(15px,1.25vw,16.5px)] leading-relaxed text-[var(--muted)]">
                <p>
                  Discover opportunities to learn from experts, exchange ideas with peers and build meaningful professional connections through EAGLE 2.0 events.
                </p>
                <p>
                  From technical seminars and practical workshops to leadership conversations, networking meetups and community initiatives, our proposed event programme is designed to make professional development engaging, accessible and relevant.
                </p>
                <p>
                  Explore upcoming events, find topics that interest you and take the next step in your professional journey.
                </p>
              </div>

              {/* Clickable event category chips mapped to /events category filter */}
              <div className="mt-4 flex flex-wrap gap-2">
                {UPCOMING_EVENT_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    href={`/events?category=${encodeURIComponent(cat.category)}#events-calendar`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-mist/[0.14] bg-mist/[0.04] px-4 py-1.5 text-[12.5px] font-medium text-[var(--fg-soft)] transition-colors hover:border-gold/60 hover:bg-gold/10 hover:text-gold"
                  >
                    <span>{cat.label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {featured.length > 0 ? (
            <div className="-mx-5 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
              {featured.map((e, i) => (
                <Reveal key={e.id} delay={i * 90} className="w-[86%] min-w-0 shrink-0 snap-start md:w-auto">
                  <EventTile event={e} wing={eventWing(e, wings)} speakers={eventSpeakers(e, speakers)} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-12 text-[var(--muted)]">
              New events are being scheduled — check back soon.
            </p>
          )}

          {/* Centered button section at the bottom */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="group flex h-12 items-center gap-3 rounded-full border border-mist/[0.18] bg-mist/[0.04] pl-6 pr-2 text-[14px] font-semibold text-[var(--fg)] transition hover:border-mist/50 hover:bg-mist/[0.08]"
            >
              Explore All Events
              <span className="grid h-8 w-8 place-items-center rounded-full bg-mist/[0.1] transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
            <Link
              href="/events#register"
              className="flex h-12 items-center rounded-full bg-grad-primary px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_-12px_rgb(var(--lime-rgb)/0.8)] transition hover:brightness-110"
            >
              Register for an Event
            </Link>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ WHY JOIN US (bento) */}
      <section className="relative border-t border-[var(--line)] py-14 md:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              eyebrow="Why join EAGLE 2.0"
              title="More than a network."
              accent="A community that moves you forward."
              accentTone="gold"
              size="lg"
            />
          </Reveal>
          <div className="mt-12 grid grid-cols-2 auto-rows-[minmax(170px,auto)] gap-3 md:mt-16 md:auto-rows-[minmax(210px,auto)] md:grid-cols-4 md:gap-4">
            {WHY_JOIN.slice(0, 5).map((w, i) => {
              const Icon = WHY_ICONS[w.key as keyof typeof WHY_ICONS] || Users;
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
              <Reveal delay={350} className="col-span-2 md:col-span-2">
                <FxCard className="flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-mist/[0.08] bg-grad-surface p-5 md:rounded-[28px] md:p-7">
                  <span className="fx-icon relative grid h-10 w-10 place-items-center rounded-2xl bg-brand-500/15 text-brand-200 md:h-12 md:w-12">
                    <TrendingUp className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="relative mt-6">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">06</span>
                    <h3 className="mt-1 font-display text-[19px] font-medium leading-tight text-[var(--fg)] md:text-[24px]">
                      {WHY_JOIN[5].title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)] md:text-[14.5px]">
                      {WHY_JOIN[5].text}
                    </p>
                  </div>
                </FxCard>
              </Reveal>
            )}
            {WHY_JOIN[6] && (
              <Reveal delay={400} className="col-span-2 md:col-span-2">
                <FxCard className="flex h-full flex-col justify-between overflow-hidden rounded-[24px] border border-mist/[0.08] bg-grad-surface p-5 md:rounded-[28px] md:p-7">
                  <span className="fx-icon relative grid h-10 w-10 place-items-center rounded-2xl bg-brand-500/15 text-brand-200 md:h-12 md:w-12">
                    <Heart className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="relative mt-6">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">07</span>
                    <h3 className="mt-1 font-display text-[19px] font-medium leading-tight text-[var(--fg)] md:text-[24px]">
                      {WHY_JOIN[6].title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted)] md:text-[14.5px]">
                      {WHY_JOIN[6].text}
                    </p>
                  </div>
                </FxCard>
              </Reveal>
            )}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/join"
              className="group inline-flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-[#2A1A0E] transition hover:brightness-105"
            >
              Become Part of EAGLE 2.0
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </span>
            </Link>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ 2.7 OUR PROFESSIONAL WINGS */}
      <section className="relative overflow-hidden border-t border-[var(--line)] py-14 md:py-20">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
        <Container size="wide" className="relative">
          <Reveal>
            <SectionHeading
              eyebrow="Our Professional Wings"
              title="Ten Wings."
              accent="One Community."
              size="lg"
              lead="Every professional journey is different. EAGLE 2.0 brings together diverse interests through dedicated wings that encourage focused learning, collaboration and year-round engagement."
            />
            <div className="mt-4 max-w-[76ch] text-[15.5px] leading-relaxed text-[var(--muted)]">
              <p>
                Whether your interests lie in taxation, audit, entrepreneurship, technology, career development, wellness or social impact, our wing-based approach is designed to help you connect with the right people and participate in relevant initiatives.
              </p>
            </div>
            <div className="mt-6 flex justify-start">
              <Link
                href="/wings"
                className="group inline-flex h-12 items-center gap-3 rounded-full border border-mist/[0.18] px-6 text-[14px] font-semibold text-[var(--fg)] transition hover:border-gold/50 hover:bg-gold/[0.04]"
              >
                Explore All Ten Wings
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
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

      {/* ------------------------------------------------------------------ 2.8 MEMBER JOURNEY (pinned horizontal scroll) */}
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

      {/* ------------------------------------------------------------------ 2.9 FEATURED INITIATIVES */}
      {initiatives.length > 0 && (
        <section className="relative overflow-hidden border-t border-[var(--line)] py-10 md:py-16">
          <Container size="wide">
            <Reveal>
              <div className="flex max-w-5xl flex-col gap-4">
                <Kicker tone="gold">Featured initiatives</Kicker>
                <h2 className="font-display text-[clamp(28px,3.5vw,54px)] font-medium leading-[1.05] tracking-[-0.035em] text-[var(--fg)]">
                  Ideas into Action.{' '}
                  <AccentText tone="hero">Community into Impact.</AccentText>
                </h2>
                <div className="mt-1 flex max-w-[80ch] flex-col gap-2.5 text-[clamp(15px,1.25vw,16.5px)] leading-relaxed text-[var(--muted)]">
                  <p>
                    EAGLE 2.0 aims to translate its vision into practical initiatives that create opportunities for learning, networking and collective growth.
                  </p>
                  <p>
                    Our proposed initiatives span technical knowledge sessions, career and leadership development, technology and AI awareness, professional networking, mentorship, wellness and social impact. Through our professional wings and community leadership, we aim to develop a consistent programme of activities that encourages participation, creates meaningful connections and supports the evolving needs of the profession.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="mt-12 space-y-12">
              {[
                { items: initiatives.slice(0, 4), startIdx: 0 },
                { items: initiatives.slice(4, 8), startIdx: 4 },
              ].map((group, groupIdx) => (
                <div key={groupIdx} className="relative">
                  {/* Horizontal connecting line passing through number circles */}
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 top-[27px] hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 lg:block"
                  />
                  <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {group.items.map((it, idx) => {
                      const num = group.startIdx + idx + 1;
                      return (
                        <Reveal as="li" key={it.id} delay={idx * 80} className="relative flex flex-col h-full">
                          <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border border-gold/40 bg-bg font-display text-[18px] font-semibold text-gold">
                            {String(num).padStart(2, '0')}
                          </span>
                          <FxCard className="mt-6 flex flex-1 flex-col justify-start rounded-[24px] border border-mist/[0.08] bg-grad-surface p-6 min-h-[220px]">
                            {it.tag && (
                              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
                                {it.tag}
                              </p>
                            )}
                            <h3 className="mt-3 font-display text-[20px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                              {it.title}
                            </h3>
                            <p className="mt-3 text-[14px] leading-relaxed text-[var(--muted)]">
                              {it.description}
                            </p>
                          </FxCard>
                        </Reveal>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------------ 2.10 NEWS & UPDATES */}
      {news.length > 0 && (
        <section className="relative border-t border-[var(--line)] py-14 md:py-20">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                eyebrow="News & Updates"
                title="What's New at"
                accent="EAGLE 2.0"
                lead="Stay informed about EAGLE 2.0 announcements, upcoming events, professional developments, community initiatives and member achievements."
                size="lg"
                action={
                  <Link
                    href="/news"
                    className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]"
                  >
                    <span className="draw-underline">Read All Updates</span>
                    <ArrowUpRight
                      className="h-4 w-4 transition group-hover:rotate-45"
                      aria-hidden
                    />
                  </Link>
                }
              />
              <div className="mt-4 max-w-[44ch] text-[15.5px] leading-relaxed text-[var(--muted)]">
                <p>
                  Explore updates from our wings, learn about new opportunities to participate and follow the ideas and initiatives shaping our community.
                </p>
              </div>
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {news.map((n, i) => (
                <Reveal key={n.id} delay={i * 80}>
                  <Link
                    href={`/news/${n.slug}`}
                    className="group flex h-full flex-col rounded-[24px] border border-mist/[0.09] bg-[var(--card)] p-5 transition-[border-color,box-shadow] duration-300 hover:border-mist/[0.16] hover:shadow-[0_18px_40px_-28px_rgb(var(--mist-rgb)/0.35)] md:p-6"
                  >
                    {n.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.coverImageUrl}
                        alt=""
                        className="-mx-1 -mt-1 mb-5 aspect-[16/9] w-[calc(100%+0.5rem)] rounded-[18px] object-cover"
                        loading="lazy"
                      />
                    )}
                    <p className="flex flex-wrap items-center gap-x-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
                      <span className="text-brand-500">{n.category}</span>
                      <span aria-hidden>·</span>
                      <span>{n.date}</span>
                    </p>
                    <h3 className="mt-4 font-display text-[21px] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--fg)] group-hover:text-brand-500">
                      {n.title}
                    </h3>
                    <p className="mt-2.5 line-clamp-3 text-[14.5px] leading-relaxed text-[var(--muted)]">{n.summary}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13.5px] font-semibold text-[var(--fg)]">
                      Read <ArrowUpRight className="h-4 w-4 text-brand-500" aria-hidden />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------------ 2.11 MEMBER TESTIMONIALS / PARTICIPATION */}
      <section className="relative border-t border-[var(--line)] py-14 md:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              eyebrow="Member Testimonials"
              title="A Community Built"
              accent="Through Participation."
              accentTone="gold"
              size="lg"
              lead="A strong professional community is shaped by the people who participate, contribute and grow together. Hear from our members about their experiences, perspectives and aspirations for EAGLE 2.0."
            />
          </Reveal>
          {testimonials.length > 0 ? (
            <ul
              aria-label="Member testimonials"
              className={cn(
                'mt-12 grid gap-6',
                testimonials.length === 1
                  ? 'max-w-[640px]'
                  : testimonials.length === 2
                    ? 'md:grid-cols-2'
                    : 'md:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {testimonials.map((t, i) => (
                <Reveal as="li" key={t.id} delay={i * 80} className="flex h-full">
                  <figure className="glass-panel flex w-full flex-col justify-between rounded-[28px] border border-mist/[0.08] p-7 transition duration-300 hover:border-gold/30">
                    <div>
                      <Quote className="h-8 w-8 text-gold" aria-hidden />
                      {/* Member Message */}
                      <blockquote className="mt-4 text-[16px] leading-relaxed text-[var(--fg)]">
                        “{t.quote}”
                      </blockquote>
                    </div>
                    {/* Member Name, Profile & Avatar */}
                    <figcaption className="mt-6 flex items-center gap-3.5 border-t border-mist/[0.08] pt-5">
                      <Avatar name={t.name} src={t.photoUrl} size={46} className="ring-2 ring-gold/30" />
                      <div className="min-w-0 flex-1">
                        <span className="block font-display text-[16px] font-semibold text-[var(--fg)]">
                          {t.name}
                        </span>
                        {t.designation && (
                          <span className="block text-[13px] leading-snug text-[var(--muted)]">
                            {t.designation}
                          </span>
                        )}
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </ul>
          ) : (
            /* Blueprint Section 2.11 Note: Until testimonials are available, feature community objectives */
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  no: '01',
                  title: 'Continuous Professional Learning',
                  desc: 'Encourage knowledge sharing and continuous professional learning across accounting, tax, audit, finance and corporate law.',
                },
                {
                  no: '02',
                  title: 'Pan-India Professional Networking',
                  desc: 'Create opportunities for meaningful networking across cities, industries, firms and specialized practice areas.',
                },
                {
                  no: '03',
                  title: 'Career & Practice Leadership',
                  desc: 'Support career development, entrepreneurship and professional leadership for young CAs and seasoned practitioners.',
                },
                {
                  no: '04',
                  title: 'Technology & AI Readiness',
                  desc: 'Promote awareness of technology, AI, automation and emerging tools transforming the modern accounting ecosystem.',
                },
                {
                  no: '05',
                  title: 'Mentorship & Peer Learning',
                  desc: 'Encourage mentorship, peer learning and cross-generational collaboration between leaders, members and students.',
                },
                {
                  no: '06',
                  title: 'Wellness & Community Impact',
                  desc: 'Foster wellness, work-life balance, inclusion and meaningful opportunities to contribute to the profession and society.',
                },
              ].map((obj, i) => (
                <Reveal key={obj.no} delay={i * 70}>
                  <FxCard className="glass-panel flex h-full flex-col rounded-[28px] p-7">
                    <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-gold">
                      Objective {obj.no}
                    </span>
                    <h3 className="mt-3 font-display text-[20px] font-medium leading-tight text-[var(--fg)]">
                      {obj.title}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--muted)]">
                      {obj.desc}
                    </p>
                  </FxCard>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------------ 2.12 CALL TO ACTION */}
      <section className="relative px-5 pb-6 md:px-8 md:pb-8">
        <Reveal className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[40px] bg-grad-primary px-6 py-12 text-center md:px-16 md:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gold/40 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-300/50 blur-[110px]"
          />
          <p className="relative font-display text-[clamp(16px,2vw,24px)] font-medium tracking-normal text-[#FDE047]">
            Your Profession. Your People.{' '}
            <em className="font-serif font-normal italic inline-block">
              Your Next Chapter.
            </em>
          </p>
          <h2 className="relative mx-auto mt-4 max-w-[22ch] font-display text-[clamp(42px,7vw,92px)] font-medium leading-[1.1] tracking-normal text-white">
            नई सोच,{' '}
            <span className="font-display font-medium text-[#FDE047] drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              नई उड़ान
            </span>
          </h2>
          <p className="relative mx-auto mt-5 max-w-[58ch] text-[clamp(15px,1.3vw,17px)] leading-relaxed text-white/90">
            The future of the profession is shaped by people who learn together, build together and move forward together. Join EAGLE 2.0 and be part of a community committed to collective progress.
          </p>
          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/join"
              className="group flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-[#2A1A0E] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] transition hover:brightness-105"
            >
              Join the EAGLE 2.0 Community
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </span>
            </Link>
            <Link
              href="/events"
              className="flex h-14 items-center rounded-full border border-white/40 bg-white/5 px-6 text-[15px] font-semibold text-white transition hover:bg-white/15 hover:border-white/60"
            >
              Explore Events
            </Link>
            <Link
              href={registerHref}
              className="flex h-14 items-center rounded-full border border-[#FDE047]/60 bg-[#FDE047]/10 px-6 text-[15px] font-semibold text-[#FDE047] transition hover:bg-[#FDE047]/20"
            >
              Register for an Event
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
