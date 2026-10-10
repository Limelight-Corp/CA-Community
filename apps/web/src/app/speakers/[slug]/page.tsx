import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Linkedin, Mail, Mic2, Quote, Sparkles } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker } from '@ascend/ui';
import { CountUp, Marquee, Reveal } from '../../../components/ui-client';
import { FxCard } from '../../../components/home/Interactive';
import { getItems, getSettings } from '../../../lib/community-store';
import { eventSpeakers, eventWing, formatEventDate, isUpcoming, sortByDate } from '../../../lib/events';
import { generatedGradient, safeUrl, truncate } from '../../../lib/content';
import { jsonLd, siteUrl } from '../../../lib/seo';
import { EventTile } from '../../../components/events/EventTile';
import { PillLink, Section } from '../../../components/content/ui';

type Params = Promise<{ slug: string }>;

// Rendered per request so edits in the admin show up at once.
export const dynamic = 'force-dynamic';

function findSpeaker(slug: string) {
  return getItems<CommunitySpeaker>('speakers', true).find((s) => s.slug === slug);
}

function initials(name: string) {
  return name
    .replace(/^CA\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

/** "15+" → { n: 15, suffix: "+" } so plain numbers can count up; anything else is shown as text. */
function parseStat(v: string): { n: number; prefix: string; suffix: string } | null {
  const m = v.trim().match(/^([^\d]*)(\d{1,7})([^\d]*)$/);
  return m ? { prefix: m[1]!, n: Number(m[2]), suffix: m[3]! } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const speaker = findSpeaker(slug);
  if (!speaker) return { title: 'Speaker not found' };
  const description = truncate(`${speaker.name} — ${speaker.headline || speaker.title}. ${speaker.bio}`, 160);
  const image = safeUrl(speaker.avatarUrl);
  return {
    title: speaker.name,
    description,
    alternates: { canonical: `/speakers/${speaker.slug}` },
    openGraph: { type: 'profile', title: speaker.name, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function SpeakerPage({ params }: { params: Params }) {
  const { slug } = await params;
  const speaker = findSpeaker(slug);
  if (!speaker) notFound();

  const { siteName } = getSettings();
  const allSpeakers = getItems<CommunitySpeaker>('speakers', true);
  const wings = getItems<CommunityWing>('wings', true);
  const theirs = sortByDate(getItems<CommunityEvent>('events', true).filter((e) => e.speakerSlugs?.includes(speaker.slug)));
  const upcoming = theirs.filter((e) => isUpcoming(e));
  const past = theirs.filter((e) => !isUpcoming(e)).reverse();
  const linkedin = safeUrl(speaker.linkedinUrl);
  const avatar = safeUrl(speaker.avatarUrl);
  const [first, ...rest] = speaker.name.split(' ');
  const highlights = (speaker.highlights ?? []).filter(Boolean);
  const talks = (speaker.talks ?? []).filter(Boolean);
  const stats =
    speaker.stats && speaker.stats.length
      ? speaker.stats
      : [
          { value: String(upcoming.length), label: upcoming.length === 1 ? 'Upcoming session' : 'Upcoming sessions' },
          { value: String(theirs.length), label: theirs.length === 1 ? 'Session at ASCEND' : 'Sessions at ASCEND' },
          { value: String(speaker.expertise.length), label: 'Areas of expertise' },
        ].filter((s) => Number(s.value) > 0);
  const related = allSpeakers
    .filter((s) => s.slug !== speaker.slug)
    .map((s) => ({ s, overlap: s.expertise.filter((x) => speaker.expertise.includes(x)).length }))
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3)
    .map((x) => x.s);

  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: speaker.name,
    jobTitle: speaker.title,
    description: speaker.bio,
    url: `${siteUrl()}/speakers/${speaker.slug}`,
    ...(avatar ? { image: avatar.startsWith('/') ? `${siteUrl()}${avatar}` : avatar } : {}),
    ...(speaker.organisation ? { worksFor: { '@type': 'Organization', name: speaker.organisation } } : {}),
    ...(speaker.qualification ? { hasCredential: speaker.qualification } : {}),
    ...(speaker.expertise.length ? { knowsAbout: speaker.expertise } : {}),
    ...(linkedin ? { sameAs: [linkedin] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personLd) }} />

      {/* ------------------------------------------------------------------ Hero */}
      <section className="grain relative overflow-hidden border-b border-[var(--line)]">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <Container size="wide" className="relative z-10 pb-14 pt-8 md:pb-20 md:pt-12">
          <Link href="/speakers" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] hover:text-[var(--fg)]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All speakers
          </Link>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
            <div className="flex min-w-0 flex-col gap-6">
              <Kicker tone="gold">
                <Mic2 className="h-3.5 w-3.5" aria-hidden /> Speaker at {siteName}
              </Kicker>
              <h1 className="font-display text-[clamp(44px,7.6vw,108px)] font-medium leading-[0.9] tracking-[-0.055em] text-[var(--fg)]">
                {first} <AccentText tone="hero">{rest.join(' ')}</AccentText>
              </h1>
              {speaker.headline && <p className="max-w-[40ch] font-serif text-[clamp(20px,2vw,26px)] italic leading-snug text-gold-soft">{speaker.headline}</p>}
              <div className="flex flex-col gap-1">
                <p className="text-[18px] text-[var(--fg)]">{speaker.title}</p>
                {(speaker.qualification || speaker.organisation) && (
                  <p className="text-[15px] text-[var(--muted)]">{[speaker.qualification, speaker.organisation].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              {speaker.expertise.length > 0 && (
                <ul className="flex flex-wrap gap-2" aria-label="Expertise">
                  {speaker.expertise.map((x) => (
                    <li key={x} className="glass-panel rounded-full px-3.5 py-1.5 text-[13.5px] text-[var(--fg)]">
                      {x}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                {upcoming.length > 0 && (
                  <PillLink href="#sessions" variant="gold" icon={<CalendarDays className="h-4 w-4" aria-hidden />}>
                    See sessions
                  </PillLink>
                )}
                {linkedin && (
                  <PillLink href={linkedin} external variant="ghost" icon={<Linkedin className="h-4 w-4" aria-hidden />}>
                    Connect on LinkedIn
                  </PillLink>
                )}
              </div>
            </div>

            {/* Portrait card */}
            <FxCard max={6} className="group relative mx-auto w-full max-w-[400px] overflow-hidden rounded-[32px] border border-mist/[0.12] bg-grad-surface">
              <div className="grain relative h-[180px] overflow-hidden bg-brand-950">
                <div aria-hidden className="mesh-drift" style={{ background: generatedGradient(speaker.slug) }} />
                <span
                  aria-hidden
                  className="fx-ghost text-outline pointer-events-none absolute -bottom-10 right-2 select-none font-display text-[170px] font-semibold leading-none tracking-[-0.06em] opacity-70"
                >
                  {initials(speaker.name)}
                </span>
              </div>
              <div className="relative px-6 pb-6">
                <div className="halo -mt-20 w-fit rounded-[28px]">
                  <Avatar name={speaker.name} src={avatar} size={150} rounded="xl" className="rounded-[26px] text-[48px] ring-4 ring-bg" />
                </div>
                <p className="mt-4 font-display text-[22px] font-medium leading-tight text-[var(--fg)]">{speaker.name}</p>
                <p className="text-[13.5px] text-[var(--muted)]">{speaker.title}</p>
                {upcoming[0] && (
                  <Link
                    href={`/events/${upcoming[0].slug}`}
                    className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-3 transition hover:border-gold/50"
                  >
                    <span className="min-w-0">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-gold">Next session</span>
                      <span className="block truncate text-[14px] font-medium text-[var(--fg)]">{upcoming[0].title}</span>
                      <span className="block text-[12px] text-[var(--muted)]">{formatEventDate(upcoming[0], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  </Link>
                )}
              </div>
            </FxCard>
          </div>

          {/* Numbers */}
          {stats.length > 0 && (
            <dl className="mt-12 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))] lg:max-w-[min(100%,calc(var(--n)*290px))]" style={{ '--n': stats.length } as React.CSSProperties}>
              {stats.map((s, i) => {
                const parsed = parseStat(s.value);
                return (
                  <Reveal key={`${s.label}-${i}`} delay={i * 80}>
                    <div className="glass-panel relative overflow-hidden rounded-[22px] p-5">
                      <dt className="text-[13px] text-[var(--muted)]">{s.label}</dt>
                      <dd className="mt-1 font-display text-[clamp(36px,4vw,56px)] font-semibold leading-none tracking-[-0.04em] text-[var(--fg)] tabular-nums">
                        {parsed ? (
                          <>
                            {parsed.prefix}
                            <CountUp value={parsed.n} />
                            <span className="text-gold">{parsed.suffix}</span>
                          </>
                        ) : (
                          s.value
                        )}
                      </dd>
                    </div>
                  </Reveal>
                );
              })}
            </dl>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------------------------ Expertise marquee */}
      {speaker.expertise.length + talks.length > 0 && (
        <div className="border-b border-[var(--line)] py-4">
          <Marquee ariaLabel={`${speaker.name} — topics`} duration={36}>
            {[...speaker.expertise, ...talks].map((t, i) => (
              <span key={`${t}-${i}`} className="inline-flex items-center gap-3 font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--muted)]">
                <Sparkles className={`h-4 w-4 ${i % 2 ? 'text-gold' : 'text-brand-300'}`} aria-hidden />
                {t}
              </span>
            ))}
          </Marquee>
        </div>
      )}

      {/* ------------------------------------------------------------------ About + highlights */}
      <Section className="py-14 md:py-20" labelledBy="about-heading">
        <Container size="wide" className={`grid gap-12 ${highlights.length ? 'lg:grid-cols-[1fr_1fr]' : 'lg:grid-cols-[1.4fr_1fr]'} lg:gap-16`}>
          <div className="flex flex-col gap-5">
            <Kicker>About</Kicker>
            <h2 id="about-heading" className="font-display text-[clamp(30px,4vw,52px)] font-medium leading-[1] tracking-[-0.045em] text-[var(--fg)]">
              Meet <AccentText tone="gold">{first === 'CA' ? rest[0] : first}.</AccentText>
            </h2>
            <div className="flex flex-col gap-4 text-[clamp(16px,1.4vw,19px)] leading-relaxed text-[var(--fg-soft)]">
              {speaker.bio.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {speaker.quote && (
              <figure className="relative mt-4 overflow-hidden rounded-[26px] border border-gold/25 bg-gold/[0.05] p-6 md:p-8">
                <Quote className="absolute -right-2 -top-2 h-24 w-24 text-gold/15" aria-hidden />
                <blockquote className="relative font-serif text-[clamp(20px,2vw,26px)] italic leading-snug text-[var(--fg)]">“{speaker.quote}”</blockquote>
                <figcaption className="relative mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">— {speaker.name}</figcaption>
              </figure>
            )}
          </div>

          {highlights.length > 0 ? (
            <div className="flex flex-col gap-5">
              <Kicker tone="gold">Highlights</Kicker>
              <ol className="relative flex flex-col gap-3">
                <span aria-hidden className="absolute bottom-6 left-[21px] top-6 w-px bg-gradient-to-b from-gold/60 via-brand-300/40 to-transparent" />
                {highlights.map((h, i) => (
                  <Reveal as="li" key={`${h}-${i}`} delay={(i % 5) * 70}>
                    <FxCard max={4} className="group flex items-start gap-4 rounded-[20px] border border-mist/[0.1] bg-grad-surface p-4">
                      <span className="fx-icon relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grad-primary font-mono text-[12px] font-semibold text-white ring-4 ring-bg">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="pt-2.5 text-[15px] leading-relaxed text-[var(--fg)]">{h}</span>
                    </FxCard>
                  </Reveal>
                ))}
              </ol>
            </div>
          ) : (
            speaker.expertise.length > 0 && (
              <div className="flex flex-col gap-5">
                <Kicker tone="gold">Expertise</Kicker>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {speaker.expertise.map((x, i) => (
                    <Reveal as="li" key={x} delay={(i % 4) * 70}>
                      <FxCard max={6} className="group flex items-center gap-3 rounded-[20px] border border-mist/[0.1] bg-grad-surface p-4">
                        <span className="fx-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                          <Check className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="font-display text-[18px] font-medium text-[var(--fg)]">{x}</span>
                      </FxCard>
                    </Reveal>
                  ))}
                </ul>
              </div>
            )
          )}
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ Signature talks */}
      {talks.length > 0 && (
        <Section className="border-t border-[var(--line)] bg-grad-surface py-14 md:py-20" labelledBy="talks-heading">
          <Container size="wide">
            <Kicker>Signature talks</Kicker>
            <h2 id="talks-heading" className="mt-4 font-display text-[clamp(30px,4vw,52px)] font-medium leading-[1] tracking-[-0.045em] text-[var(--fg)]">
              Topics {first === 'CA' ? rest[0] : first} <AccentText tone="hero">speaks on.</AccentText>
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talks.map((t, i) => (
                <Reveal as="li" key={`${t}-${i}`} delay={(i % 3) * 80} className="h-full">
                  <FxCard max={6} className="group flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[24px] border border-mist/[0.1] bg-bg/60 p-6">
                    <span aria-hidden className="fx-ghost text-outline pointer-events-none absolute -right-1 -top-5 select-none font-display text-[90px] font-semibold leading-none tracking-[-0.06em] opacity-40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="fx-icon relative grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
                      <Mic2 className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="relative font-display text-[21px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)]">{t}</span>
                  </FxCard>
                </Reveal>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ Sessions */}
      <Section id="sessions" className="border-t border-[var(--line)] py-14 md:py-20" labelledBy="speaking-heading">
        <Container size="wide">
          <Kicker tone="gold">On stage</Kicker>
          <h2 id="speaking-heading" className="mt-4 font-display text-[clamp(30px,4vw,52px)] font-medium leading-[1] tracking-[-0.045em] text-[var(--fg)]">
            Speaking <AccentText tone="gold">at.</AccentText>
          </h2>
          {upcoming.length === 0 ? (
            <div className="mt-8 flex flex-col gap-3 rounded-[24px] border border-dashed border-mist/[0.16] p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] text-[var(--muted)]">No upcoming sessions announced yet.</p>
              <Link href="/events" className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-gold hover:text-gold-soft">
                Browse all events <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e, i) => (
                <Reveal as="li" key={e.id} delay={(i % 3) * 80} className="flex">
                  <EventTile event={e} wing={eventWing(e, wings)} speakers={eventSpeakers(e, allSpeakers)} className="w-full" />
                </Reveal>
              ))}
            </ul>
          )}

          {past.length > 0 && (
            <div className="mt-12">
              <h3 className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Previously spoke at</h3>
              <ul className="mt-4 border-t border-[var(--line)]">
                {past.map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.slug}`} className="group flex flex-col gap-1 border-b border-[var(--line)] py-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-display text-[20px] tracking-[-0.02em] text-[var(--fg)] transition-transform duration-300 group-hover:translate-x-2">{e.title}</span>
                      <span className="inline-flex items-center gap-2 text-[13.5px] text-[var(--muted)]">
                        <CalendarDays className="h-4 w-4" aria-hidden /> {formatEventDate(e)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>

      {/* ------------------------------------------------------------------ More speakers */}
      {related.length > 0 && (
        <Section className="border-t border-[var(--line)] py-14 md:py-20" labelledBy="more-heading">
          <Container size="wide">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <h2 id="more-heading" className="font-display text-[clamp(28px,3.6vw,46px)] font-medium leading-[1] tracking-[-0.04em] text-[var(--fg)]">
                More <AccentText tone="hero">voices.</AccentText>
              </h2>
              <Link href="/speakers" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-200 hover:text-[var(--fg)]">
                All speakers <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((s) => (
                <li key={s.id} className="min-w-0">
                  <FxCard max={6} className="group flex min-w-0 items-center gap-4 rounded-[22px] border border-mist/[0.1] bg-grad-surface p-4">
                    <span className="halo shrink-0 rounded-2xl">
                      <Avatar name={s.name} src={safeUrl(s.avatarUrl)} size={60} rounded="xl" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/speakers/${s.slug}`} className="block truncate font-display text-[18px] font-medium text-[var(--fg)] after:absolute after:inset-0 group-hover:text-gold-soft">
                        {s.name}
                      </Link>
                      <span className="block truncate text-[13px] text-[var(--muted)]">{s.title}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-200 transition-transform group-hover:rotate-45" aria-hidden />
                  </FxCard>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      {/* ------------------------------------------------------------------ Invite CTA */}
      <section className="pb-12 md:pb-16">
        <Container size="wide">
          <div className="grain relative overflow-hidden rounded-[34px] border border-gold/25 bg-grad-surface p-7 md:p-12">
            <div className="aurora opacity-60" aria-hidden>
              <i />
            </div>
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex max-w-[720px] flex-col gap-3">
                <h2 className="font-display text-[clamp(30px,4.4vw,60px)] font-medium leading-[1] tracking-[-0.05em] text-[var(--fg)]">
                  Want a session with <AccentText tone="gold">{first === 'CA' ? rest[0] : first}?</AccentText>
                </h2>
                <p className="text-[16px] leading-relaxed text-[var(--muted)]">Tell us about your chapter, firm or event — the team will get in touch.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <PillLink href="/contact#contact-form" variant="gold" icon={<Mail className="h-4 w-4" aria-hidden />}>
                  Get in touch
                </PillLink>
                <PillLink href="/events" variant="ghost">
                  See events
                </PillLink>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
