import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Container } from '@ascend/ui';
import { Reveal } from '../../components/ui-client';
import { FxCard } from '../../components/home/Interactive';
import { getSettings } from '../../lib/community-store';
import { allWingHubs, wingEvents } from '../../lib/wings';
import { CtaBand, PageHero, Section } from '../../components/content/ui';
import { wingCountWords } from '../../lib/taxonomy';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Professional Wings',
    description: `The professional wings of ${siteName} — each with its own convener, events, resources and community.`,
    alternates: { canonical: '/wings' },
  };
}

export default function WingsIndexPage() {
  const wings = allWingHubs().map((w) => ({ ...w, upcoming: wingEvents(w).upcoming.length }));

  return (
    <>
      <PageHero
        eyebrow={`${wings.length} professional wings`}
        eyebrowTone="blue"
        title={`${wingCountWords(wings.length)}.`}
        accent="One community."
        accentTone="hero"
        lead="Each wing has its own convener, calendar and resources. Pick the ones that match your practice and interests."
        ghost="WINGS"
      />

      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wings.map((w, i) => (
              <Reveal as="li" key={w.slug} delay={(i % 3) * 80} className="h-full">
                <FxCard as="article" max={6} className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-mist/[0.1] bg-grad-surface hover:border-gold/30">
                  <div className="grain relative h-[110px] overflow-hidden bg-brand-950">
                    <div
                      aria-hidden
                      className="mesh-drift"
                      style={{
                        background: `radial-gradient(55% 75% at 75% 25%, color-mix(in srgb, ${w.color} 80%, transparent), transparent 70%), radial-gradient(45% 60% at 15% 90%, rgb(var(--gold-rgb) / 0.25), transparent 70%), linear-gradient(140deg, var(--brand-800), var(--brand-950))`,
                        animationDelay: `${-i * 2.3}s`,
                      }}
                    />
                    <span
                      aria-hidden
                      className="fx-ghost text-outline pointer-events-none absolute -bottom-7 right-3 select-none font-display text-[120px] font-semibold leading-none tracking-[-0.06em] opacity-70"
                    >
                      {String(w.number).padStart(2, '0')}
                    </span>
                    <span className="absolute left-5 top-5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/80">
                      Wing {String(w.number).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <h2 className="font-display text-[24px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)] transition-colors group-hover:text-gold-soft">
                      <Link href={`/wings/${w.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline">
                        {w.name}
                      </Link>
                    </h2>
                    <ul className="flex flex-wrap gap-1.5" aria-label="Focus areas">
                      {w.focus.slice(0, 5).map((f) => (
                        <li key={f} className="rounded-full border border-mist/[0.12] px-2.5 py-0.5 text-[12px] text-[var(--fg-soft)]">
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
                        <CalendarDays className="h-4 w-4 text-brand-200" aria-hidden />
                        {w.upcoming > 0 ? `${w.upcoming} upcoming ${w.upcoming === 1 ? 'event' : 'events'}` : 'Events coming soon'}
                      </span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-mist/[0.08] transition-all duration-300 group-hover:rotate-45 group-hover:bg-grad-primary group-hover:text-white">
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </FxCard>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <CtaBand
        title="Find your"
        accent="wing."
        lead="Members can join as many wings as they like when they apply."
        primary={{ href: '/join#register', label: 'Become a member' }}
        secondary={{ href: '/events', label: 'See all events' }}
      />
    </>
  );
}
