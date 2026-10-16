import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight /* , Info */ } from 'lucide-react';
import { BLUEPRINT_WINGS, WINGS_PAGE_CONTENT, wingSlug } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { Reveal } from '../../components/ui-client';
import { FxCard } from '../../components/home/Interactive';
import { allWingHubs /* , wingEvents */ } from '../../lib/wings';
import { /* CtaBand, */ PageHero, Section } from '../../components/content/ui';

export async function generateMetadata(): Promise<Metadata> {
  const title = WINGS_PAGE_CONTENT.seoTitle;
  const description =
    "Explore EAGLE 2.0's ten professional wings covering tax, audit, entrepreneurship, leadership, AI, careers, wellness, social impact and global connections.";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/wings' },
    openGraph: { title, description, url: '/wings' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function WingsIndexPage() {
  const hubs = await allWingHubs();

  // Merge Blueprint wings in exact sequential order (01 to 10)
  const wings = BLUEPRINT_WINGS.map((bw) => {
    const hub = hubs.find((h) => h.number === bw.number);
    return {
      ...bw,
      slug: hub?.slug ?? wingSlug(bw.name),
      color: hub?.color || 'var(--brand-500)',
      focus: hub?.focus || [],
    };
  });

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <PageHero
        eyebrow="10 professional wings · नई सोच, नई उड़ान"
        eyebrowTone="gold"
        title={WINGS_PAGE_CONTENT.title}
        accent={WINGS_PAGE_CONTENT.accent}
        accentTone="hero"
        lead={WINGS_PAGE_CONTENT.lead}
        ghost="WINGS"
      >
        <p className="max-w-[46ch] text-[16px] leading-relaxed text-[var(--muted)]">
          {WINGS_PAGE_CONTENT.secondaryLead}
        </p>
      </PageHero>

      {/* ---------------------------------------------------------------- Wings Grid */}
      <Section className="pt-10 md:pt-14">
        <Container size="wide">
          <ul className="grid gap-6 sm:grid-cols-2">
            {wings.map((w, i) => (
              <Reveal as="li" key={w.slug} delay={(i % 2) * 90} className="h-full">
                <FxCard
                  as="article"
                  max={5}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface transition-all duration-300 hover:border-gold/40"
                >
                  {/* Visual Header */}
                  <div className="grain relative h-[120px] overflow-hidden bg-brand-950">
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
                      className="fx-ghost text-outline pointer-events-none absolute -bottom-8 right-4 select-none font-display text-[120px] font-semibold leading-none tracking-[-0.06em] opacity-60"
                    >
                      {String(w.number).padStart(2, '0')}
                    </span>
                    <span className="absolute left-6 top-5 font-mono text-[11.5px] uppercase tracking-[0.14em] text-white/80">
                      Wing {String(w.number).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col gap-4 p-6 md:p-8">
                    <div>
                      <h2 className="font-display text-[26px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)] transition-colors group-hover:text-gold-soft">
                        <Link
                          href={`/wings/${w.slug}`}
                          className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline"
                        >
                          {String(w.number).padStart(2, '0')}. {w.name}
                        </Link>
                      </h2>
                      <p className="mt-1.5 font-display text-[15px] font-medium text-gold">
                        {w.tagline}
                      </p>
                    </div>

                    <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">
                      {w.description}
                    </p>

                    <div className="mt-auto rounded-2xl border border-mist/[0.1] bg-bg/50 p-4 backdrop-blur">
                      <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                        Proposed activities
                      </span>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--fg)]">
                        {w.proposedActivities}
                      </p>
                    </div>

                    {/* ---------------------------------------------------------------- Preserved - Tags and Events Count (Not in Word Doc Section 4)
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
                    </div>
                    ---------------------------------------------------------------- */}

                    <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-[13px] font-medium text-[var(--muted)] group-hover:text-[var(--fg)]">
                      <span>Explore wing overview</span>
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-mist/[0.08] transition-all duration-300 group-hover:rotate-45 group-hover:bg-grad-primary group-hover:text-white">
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </FxCard>
              </Reveal>
            ))}
          </ul>

          {/* ---------------------------------------------------------------- Preserved - Operational Note
          <div className="mx-auto mt-12 flex max-w-[850px] items-center gap-3 rounded-[20px] border border-mist/[0.14] bg-bg/50 px-5 py-4 text-[13.5px] text-[var(--muted)] backdrop-blur">
            <Info className="h-5 w-5 shrink-0 text-gold" aria-hidden />
            <p>
              <strong className="font-semibold text-[var(--fg)]">Operational note:</strong>{' '}
              {WINGS_PAGE_CONTENT.operationalNote}
            </p>
          </div>
          ---------------------------------------------------------------- */}
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Preserved - Closing CTA Band
      <CtaBand
        title={WINGS_PAGE_CONTENT.closingCtaTitle}
        accent={WINGS_PAGE_CONTENT.closingCtaAccent}
        lead={WINGS_PAGE_CONTENT.closingCtaLead}
        primary={{ href: '/join', label: 'Explore Membership Options' }}
        secondary={{ href: '/events', label: 'Explore Upcoming Events' }}
      />
      ---------------------------------------------------------------- */}
    </>
  );
}
