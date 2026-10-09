import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Linkedin, Mic2 } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker } from '@ascend/shared';
import { Avatar, Container, EmptyState, cn } from '@ascend/ui';
import { Reveal } from '../../components/ui-client';
import { getItems, getSettings } from '../../lib/community-store';
import { isUpcoming } from '../../lib/events';
import { safeUrl } from '../../lib/content';
import { CtaBand, PageHero, Section } from '../../components/content/ui';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Speakers',
    description: `Meet the Chartered Accountants, leaders and experts speaking at ${siteName} events across tax, audit, practice, technology, leadership and more.`,
    alternates: { canonical: '/speakers' },
  };
}

export default function SpeakersPage() {
  const speakers = getItems<CommunitySpeaker>('speakers', true);
  const events = getItems<CommunityEvent>('events', true).filter((e) => isUpcoming(e));
  const upcomingCount = (slug: string) => events.filter((e) => e.speakerSlugs?.includes(slug)).length;

  return (
    <>
      <PageHero
        eyebrow={`${speakers.length} voices · and counting`}
        eyebrowTone="blue"
        title="People worth"
        accent="listening to."
        lead="Practitioners, CFOs, partners and specialists who share what actually works — on stage, in clinics and in the room after."
        ghost="MIC"
      />

      <Section>
        <Container size="wide">
          {speakers.length === 0 ? (
            <EmptyState icon={<Mic2 />} title="Speakers coming soon" description="Speaker profiles will be published as the event calendar is announced." />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {speakers.map((s, i) => (
                <Reveal as="li" key={s.id} delay={(i % 3) * 90}>
                  <SpeakerCard speaker={s} upcoming={upcomingCount(s.slug)} accent={i % 5 === 0} />
                </Reveal>
              ))}
            </ul>
          )}
        </Container>
      </Section>

      <CtaBand
        title="Got something"
        accent="to share?"
        lead="We’re always looking for practitioners to lead sessions across the ten wings."
        primary={{ href: '/contact', label: 'Propose a session' }}
        secondary={{ href: '/events', label: 'See upcoming events' }}
      />
    </>
  );
}

function SpeakerCard({ speaker, upcoming, accent }: { speaker: CommunitySpeaker; upcoming: number; accent?: boolean }) {
  const linkedin = safeUrl(speaker.linkedinUrl);
  return (
    <article
      className={cn(
        'shine group relative flex h-full flex-col gap-6 overflow-hidden rounded-[28px] border p-6 transition-transform duration-500 hover:-translate-y-1.5',
        accent ? 'border-gold/30 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Avatar name={speaker.name} src={safeUrl(speaker.avatarUrl)} size={96} rounded="xl" className="ring-1 ring-gold/30 transition-transform duration-500 group-hover:rotate-[-4deg]" />
        {upcoming > 0 && (
          <span className="rounded-full border border-ok/30 bg-ok/15 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ok">
            {upcoming} upcoming
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]">
          <Link href={`/speakers/${speaker.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline">
            {speaker.name}
          </Link>
        </h2>
        <p className="text-[14.5px] text-fg/90">{speaker.title}</p>
        {(speaker.qualification || speaker.organisation) && (
          <p className="text-[13.5px] text-[var(--muted)]">{[speaker.qualification, speaker.organisation].filter(Boolean).join(' · ')}</p>
        )}
      </div>
      {speaker.expertise.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Expertise">
          {speaker.expertise.map((x) => (
            <li key={x} className="rounded-full bg-brand-500/15 px-2.5 py-1 text-[12px] text-brand-200">
              {x}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-4">
        <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--fg)]">
          View profile <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
        </span>
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] hover:border-gold/60 hover:text-gold"
            aria-label={`${speaker.name} on LinkedIn`}
          >
            <Linkedin className="h-4 w-4" aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}
