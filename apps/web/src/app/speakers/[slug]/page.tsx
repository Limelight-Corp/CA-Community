import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Linkedin } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker } from '@ascend/ui';
import { getItems, getSettings } from '../../../lib/community-store';
import { eventSpeakers, eventWing, formatEventDate, isUpcoming, sortByDate } from '../../../lib/events';
import { safeUrl, truncate } from '../../../lib/content';
import { jsonLd, siteUrl } from '../../../lib/seo';
import { EventTile } from '../../../components/events/EventTile';
import { Section } from '../../../components/content/ui';

type Params = Promise<{ slug: string }>;

function findSpeaker(slug: string) {
  return getItems<CommunitySpeaker>('speakers', true).find((s) => s.slug === slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const speaker = findSpeaker(slug);
  if (!speaker) return { title: 'Speaker not found' };
  const description = truncate(`${speaker.name} — ${speaker.title}. ${speaker.bio}`, 160);
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

      <section className="grain relative overflow-hidden border-b border-[var(--line)] pb-16 pt-10 md:pb-24 md:pt-16">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <Container size="wide" className="relative z-10">
          <Link href="/speakers" className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] hover:text-[var(--fg)]">
            <ArrowLeft className="h-4 w-4" aria-hidden /> All speakers
          </Link>
          <div className="mt-10 grid gap-10 lg:grid-cols-[auto_1fr] lg:items-end">
            <div className="relative w-fit">
              <span className="spin-slow absolute -inset-3 rounded-[40px] border border-dashed border-gold/40" aria-hidden />
              <Avatar name={speaker.name} src={avatar} size={220} rounded="xl" className="relative rounded-[32px] text-[64px]" />
            </div>
            <div className="flex flex-col gap-6">
              <Kicker tone="gold">Speaker at {siteName}</Kicker>
              <h1 className="font-display text-[clamp(44px,8vw,112px)] font-medium leading-[0.9] tracking-[-0.055em] text-[var(--fg)]">
                {first} <AccentText tone="hero">{rest.join(' ')}</AccentText>
              </h1>
              <div className="flex flex-col gap-1">
                <p className="text-[18px] text-[var(--fg)]">{speaker.title}</p>
                {(speaker.qualification || speaker.organisation) && (
                  <p className="text-[15px] text-[var(--muted)]">{[speaker.qualification, speaker.organisation].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              {linkedin && (
                <a
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-mist/[0.16] px-4 py-2.5 text-[14px] font-medium text-[var(--fg)] hover:border-gold/60 hover:text-gold"
                >
                  <Linkedin className="h-4 w-4" aria-hidden /> Connect on LinkedIn
                </a>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Section>
        <Container size="wide" className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-5">
            <h2 className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-[var(--muted)]">About</h2>
            <div className="flex flex-col gap-5 text-[clamp(17px,1.5vw,20px)] leading-relaxed text-[var(--fg)]">
              {speaker.bio.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          {speaker.expertise.length > 0 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Expertise</h2>
              <ul className="flex flex-wrap gap-2">
                {speaker.expertise.map((x) => (
                  <li key={x} className="rounded-full border border-gold/30 bg-gold/[0.07] px-4 py-2 font-display text-[17px] tracking-[-0.02em] text-[var(--fg)]">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </Section>

      <Section className="border-t border-[var(--line)]" labelledBy="speaking-heading">
        <Container size="wide">
          <h2 id="speaking-heading" className="font-display text-[clamp(36px,5vw,72px)] font-medium leading-[0.96] tracking-[-0.05em] text-[var(--fg)]">
            Speaking <AccentText tone="gold">at</AccentText>
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-6 text-[16px] text-[var(--muted)]">
              No upcoming sessions announced yet.{' '}
              <Link href="/events" className="text-brand-200 underline underline-offset-4 hover:text-white">
                Browse all events
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <EventTile event={e} wing={eventWing(e, wings)} speakers={eventSpeakers(e, allSpeakers)} className="h-full" />
                </li>
              ))}
            </ul>
          )}

          {past.length > 0 && (
            <div className="mt-16">
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
    </>
  );
}
