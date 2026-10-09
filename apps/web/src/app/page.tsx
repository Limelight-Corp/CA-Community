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
import { ORG_MISSION, ORG_POSITIONING, ORG_VISION, WHY_JOIN } from '@ascend/shared';
import { Avatar, Container, Kicker, SectionHeading, AccentText } from '@ascend/ui';
import { Countdown, Marquee, Reveal } from '../components/ui-client';
import { getItems, getSettings } from '../lib/community-store';
import { canRegister, eventSpeakers, eventWing, isUpcoming, sortByDate } from '../lib/events';
import { EventTile } from '../components/events/EventTile';

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
  const featured = [...upcoming.filter((e) => e.featured), ...upcoming.filter((e) => !e.featured)].slice(0, 3);
  const nextRegisterable = upcoming.find(canRegister);
  const registerHref = nextRegisterable ? `/events/${nextRegisterable.slug}/register` : '/events';

  return (
    <>
      {/* ------------------------------------------------------------------ HERO */}
      <section className="grain relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <div className="grid-lines absolute inset-0" aria-hidden />

        <Container size="wide" className="relative z-10 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="grid items-end gap-14 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <Reveal>
                <Kicker tone="gold">{settings.heroEyebrow}</Kicker>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-8 font-display text-[clamp(52px,9.5vw,148px)] font-medium leading-[0.88] tracking-[-0.06em] text-[var(--fg)]">
                  {settings.heroHeadline}
                  <br />
                  <AccentText tone="hero" className="pr-3">
                    {settings.heroHeadlineAccent}
                  </AccentText>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-8 max-w-[52ch] text-[clamp(17px,1.5vw,20px)] leading-relaxed text-[var(--muted)]">
                  {settings.heroIntro}
                </p>
              </Reveal>
              <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/join"
                  className="group flex h-14 items-center gap-4 rounded-full bg-grad-gold pl-6 pr-2 text-[15px] font-semibold text-brand-950 shadow-[0_16px_40px_-16px_rgb(var(--gold-rgb)/0.8)] transition hover:brightness-105"
                >
                  Join the Community
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" aria-hidden />
                  </span>
                </Link>
                <Link
                  href="/events"
                  className="flex h-14 items-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110"
                >
                  Explore Events
                </Link>
                <Link
                  href={registerHref}
                  className="flex h-14 items-center gap-2 rounded-full border border-mist/[0.18] px-6 text-[15px] font-semibold text-[var(--fg)] transition hover:border-mist/50 hover:bg-mist/[0.04]"
                >
                  Register Now <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Reveal>
            </div>

            {/* Launch badge + countdown + next event */}
            <Reveal delay={200} className="relative">
              <div className="relative mx-auto w-full max-w-[460px]">
                <div className="absolute -right-6 -top-10 hidden h-36 w-36 md:block" aria-hidden>
                  <svg viewBox="0 0 200 200" className="spin-slow h-full w-full">
                    <defs>
                      <path id="badge-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                    </defs>
                    <text className="fill-gold font-mono text-[15px] uppercase tracking-[0.32em]">
                      <textPath href="#badge-circle">Launch · 01.01.2027 · Pan-India ·</textPath>
                    </text>
                  </svg>
                  <span className="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-grad-gold text-brand-950">
                    <Sparkles className="h-5 w-5" />
                  </span>
                </div>

                <div className="glass-panel float rounded-[32px] p-6 md:p-7">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Countdown to launch</p>
                  <Countdown to={`${ORG_POSITIONING.launchDate}T00:00:00+05:30`} className="mt-4" />
                  {nextRegisterable && (
                    <Link
                      href={`/events/${nextRegisterable.slug}`}
                      className="group mt-6 flex items-center gap-4 rounded-2xl border border-mist/[0.1] bg-bg/40 p-4 transition hover:border-gold/40"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-grad-primary text-white">
                        <CalendarDays className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-[10.5px] uppercase tracking-[0.12em] text-gold">Next up</span>
                        <span className="block truncate font-display text-[17px] font-medium text-[var(--fg)]">
                          {nextRegisterable.title}
                        </span>
                      </span>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-[var(--muted)] transition group-hover:rotate-45 group-hover:text-gold" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>

        {/* Pillars ticker */}
        <div className="relative z-10 border-y border-mist/[0.08] bg-bg/40 py-5 backdrop-blur-sm">
          <Marquee duration={30} gap="2.5rem" ariaLabel="Our pillars">
            {['Learn', 'Connect', 'Grow', 'Transform', 'Thrive', 'Contribute'].map((p, i) => (
              <span key={p} className="flex shrink-0 items-center gap-10 font-display text-[clamp(28px,4vw,52px)] font-medium tracking-[-0.04em]">
                <span className={i % 2 ? 'text-outline' : 'text-[var(--fg)]'}>{p}</span>
                <Sparkles className="h-6 w-6 text-gold" aria-hidden />
              </span>
            ))}
          </Marquee>
        </div>
      </section>

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
              <Link href="/about" className="group mt-10 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]">
                <span className="draw-underline">More about us</span>
                <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
              </Link>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2">
              <Reveal delay={60} className="shine glass-panel rounded-[28px] p-7 sm:col-span-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Our vision</p>
                <p className="mt-4 font-display text-[clamp(20px,2vw,26px)] leading-snug tracking-[-0.02em] text-[var(--fg)]">{ORG_VISION}</p>
              </Reveal>
              <Reveal delay={120} className="shine glass-panel rounded-[28px] p-7 sm:col-span-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-200">Our mission</p>
                <p className="mt-4 text-[16.5px] leading-relaxed text-[var(--muted)]">{ORG_MISSION}</p>
              </Reveal>
              {[
                { k: '10', l: 'Professional wings' },
                { k: '100', l: 'Proposed activity formats' },
                { k: '6', l: 'Community structures' },
                { k: '9', l: 'Steps from member to leader' },
              ].map((s, i) => (
                <Reveal key={s.l} delay={160 + i * 60} className="rounded-[28px] border border-mist/[0.08] p-6">
                  <span className="block font-display text-[56px] font-medium leading-none tracking-[-0.05em] text-hero-gradient">{s.k}</span>
                  <span className="mt-3 block text-[14px] text-[var(--muted)]">{s.l}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ UPCOMING EVENTS */}
      <section className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
        <div className="pointer-events-none absolute -right-40 top-10 h-[480px] w-[480px] rounded-full bg-brand-500/20 blur-[120px]" aria-hidden />
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
                  <EventTile event={e} wing={eventWing(e, wings)} speakers={eventSpeakers(e, speakers)} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="mt-14 text-[var(--muted)]">New events are being scheduled — check back soon.</p>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------------ WHY JOIN US (bento) */}
      <section className="relative border-t border-[var(--line)] py-24 md:py-32">
        <Container size="wide">
          <Reveal>
            <SectionHeading eyebrow="Why join us" title="Six reasons to" accent="belong here." accentTone="gold" size="lg" align="center" className="mx-auto" />
          </Reveal>
          <div className="mt-16 grid auto-rows-[minmax(200px,auto)] gap-4 md:grid-cols-6">
            {WHY_JOIN.map((w, i) => {
              const Icon = WHY_ICONS[w.key];
              const span = ['md:col-span-4', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-6 lg:col-span-6'][i];
              const hero = i === 0;
              return (
                <Reveal
                  key={w.key}
                  delay={i * 70}
                  className={`shine group relative overflow-hidden rounded-[28px] border border-mist/[0.08] p-7 transition-colors hover:bg-mist/[0.03] ${span} ${hero ? 'bg-grad-primary !border-transparent' : 'bg-grad-surface'}`}
                >
                  <span className={`grid h-12 w-12 place-items-center rounded-2xl ${hero ? 'bg-white/15 text-white' : 'bg-brand-500/15 text-brand-200'}`}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className={`mt-8 font-display font-medium tracking-[-0.03em] ${hero ? 'text-[clamp(32px,4vw,52px)] leading-[0.95] text-white' : 'text-[26px] text-[var(--fg)]'}`}>
                    {w.title}
                  </h3>
                  <p className={`mt-3 max-w-[44ch] text-[15px] leading-relaxed ${hero ? 'text-white/80' : 'text-[var(--muted)]'}`}>{w.text}</p>
                  <span
                    aria-hidden
                    className={`absolute -bottom-6 -right-2 font-display text-[140px] font-semibold leading-none tracking-[-0.06em] ${hero ? 'text-white/10' : 'text-mist/[0.04]'}`}
                  >
                    0{i + 1}
                  </span>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------------ INITIATIVES */}
      {initiatives.length > 0 && (
        <section className="relative overflow-hidden border-t border-[var(--line)] py-24 md:py-32">
          <Container size="wide">
            <Reveal>
              <SectionHeading eyebrow="Featured & upcoming initiatives" title="The road to" accent="launch day." size="lg" />
            </Reveal>
            <ol className="relative mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <span aria-hidden className="absolute left-0 right-0 top-[27px] hidden h-px bg-gradient-to-r from-gold/0 via-gold/50 to-gold/0 lg:block" />
              {initiatives.map((it, i) => (
                <Reveal as="li" key={it.id} delay={i * 90} className="relative">
                  <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-gold/40 bg-bg font-display text-[18px] font-semibold text-gold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-6 rounded-[24px] border border-mist/[0.08] bg-grad-surface p-6">
                    {it.tag && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-gold">{it.tag}</p>}
                    <h3 className="mt-3 font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--fg)]">{it.title}</h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--muted)]">{it.description}</p>
                    {it.ctaUrl && (
                      <Link href={it.ctaUrl} className="group mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-white">
                        {it.ctaLabel || 'Learn more'}
                        <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
                      </Link>
                    )}
                  </div>
                </Reveal>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------------ 10 WINGS MOSAIC */}
      <section className="relative border-t border-[var(--line)] py-24 md:py-32">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              eyebrow="10 professional wings"
              title="Ten wings."
              accent="One community."
              size="lg"
              lead="From tax to AI, leadership to wellness — join as many wings as you like."
            />
          </Reveal>
          <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-5">
            {wings.map((w, i) => (
              <Reveal as="li" key={w.id} delay={i * 45}>
                <Link
                  href="/about#wings"
                  className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[24px] border border-mist/[0.08] p-5 transition duration-500 hover:-translate-y-1"
                  style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${w.color} 28%, transparent), transparent 70%), var(--surface-lo)` }}
                >
                  <span
                    aria-hidden
                    className="absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-80"
                    style={{ background: w.color }}
                  />
                  <span className="relative font-mono text-[12px] text-[var(--muted)]">{String(w.number).padStart(2, '0')}</span>
                  <span className="relative">
                    <span className="block font-display text-[clamp(18px,1.7vw,23px)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--fg)]">
                      {w.name}
                    </span>
                    <span className="mt-2 block line-clamp-2 text-[12px] text-[var(--muted)]">{w.tags}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
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
                  <Link href="/news" className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]">
                    <span className="draw-underline">All news & updates</span>
                    <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
                  </Link>
                }
              />
            </Reveal>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {news.map((n, i) => (
                <Reveal key={n.id} delay={i * 80}>
                  <Link href={`/news/${n.slug}`} className="shine group flex h-full flex-col overflow-hidden rounded-[28px] border border-mist/[0.08] bg-grad-surface">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {n.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.coverImageUrl} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div
                          className="h-full w-full transition-transform duration-700 group-hover:scale-105"
                          style={{ background: `radial-gradient(80% 90% at ${20 + i * 30}% 10%, rgb(var(--lime-rgb) / 0.55), transparent 60%), radial-gradient(60% 70% at 100% 100%, rgb(var(--gold-rgb) / 0.3), transparent 60%), var(--surface-hi)` }}
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
                      <h3 className="font-display text-[21px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)] group-hover:text-white">{n.title}</h3>
                      <p className="line-clamp-3 text-[14.5px] leading-relaxed text-[var(--muted)]">{n.summary}</p>
                    </div>
                  </Link>
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
              <SectionHeading eyebrow="Member voices" title="In their" accent="words." accentTone="gold" size="lg" />
            </Reveal>
          </Container>
          <div className="mt-14">
            <Marquee duration={Math.max(30, testimonials.length * 12)} gap="1.25rem" ariaLabel="Member testimonials">
              {testimonials.map((t) => (
                <figure key={t.id} className="glass-panel flex w-[min(420px,80vw)] shrink-0 flex-col gap-6 rounded-[28px] p-7">
                  <Quote className="h-8 w-8 text-gold" aria-hidden />
                  <blockquote className="text-[17px] leading-relaxed text-[var(--fg)]">“{t.quote}”</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3">
                    <Avatar name={t.name} src={t.photoUrl} size={44} />
                    <span>
                      <span className="block font-medium text-[var(--fg)]">{t.name}</span>
                      {t.designation && <span className="block text-[13px] text-[var(--muted)]">{t.designation}</span>}
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
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-gold/40 blur-[100px]" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-brand-300/50 blur-[110px]" />
          <p className="relative font-mono text-[12px] uppercase tracking-[0.16em] text-gold-soft">{ORG_POSITIONING.launchLabel}</p>
          <h2 className="relative mx-auto mt-6 max-w-[16ch] font-display text-[clamp(44px,7.5vw,112px)] font-medium leading-[0.92] tracking-[-0.055em] text-white">
            Your profession. <em className="font-serif font-normal italic text-gold-gradient">Your people.</em>
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
