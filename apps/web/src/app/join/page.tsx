import React from 'react';
import type { Metadata } from 'next';
import { Briefcase, Check, GraduationCap, Handshake, Lightbulb, Rocket, Users } from 'lucide-react';
import {
  MEMBERSHIP_PLANS,
  MEMBER_IDENTITIES,
  MEMBER_JOURNEY,
  ORG_POSITIONING,
  ORG_WINGS,
  WHY_JOIN,
  type CommunityWing,
  type MembershipPlan,
} from '@ascend/shared';
import { AccentText, Container, Kicker, cn } from '@ascend/ui';
import { Marquee, Reveal } from '../../components/ui-client';
import { getItems, getSettings } from '../../lib/community-store';
import { PageHero, PillLink, Section } from '../../components/content/ui';
import { JoinForm } from '../../components/content/JoinForm';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Join Us — Membership',
    description: `Become a member of ${siteName}: membership plans for CAs, allied professionals and CA students, benefits, the member journey and online registration.`,
    alternates: { canonical: '/join' },
  };
}

const WHY_ICONS = {
  networking: Users,
  knowledge: Lightbulb,
  events: Rocket,
  career: Briefcase,
  mentorship: Handshake,
  growth: GraduationCap,
} as const;

function priceLabel(p: MembershipPlan) {
  return `₹${p.price.toLocaleString('en-IN')} / ${p.period}${p.priceNote ? ` ${p.priceNote}` : ''}`;
}

type PlanKey = MembershipPlan['key'];

export default async function JoinPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const requested = typeof sp.plan === 'string' ? sp.plan : undefined;
  const initialPlan = MEMBERSHIP_PLANS.some((p) => p.key === requested) ? (requested as PlanKey) : undefined;

  const storeWings = getItems<CommunityWing>('wings', true);
  const wings = ORG_WINGS.map((w) => ({
    number: w.number,
    name: w.name,
    color: storeWings.find((s) => s.number === w.number)?.color || 'var(--brand-500)',
  }));

  return (
    <>
      <PageHero
        eyebrow={`Founding membership · ${ORG_POSITIONING.launchLabel}`}
        title="Join the"
        accent="movement."
        accentTone="hero"
        lead="One membership. Ten wings, a Pan-India city network and a year-round calendar to help you learn, connect, grow and lead."
        ghost="JOIN"
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <PillLink href="#register" variant="gold">
            Apply now
          </PillLink>
          <PillLink href="#plans" variant="ghost">
            Compare plans
          </PillLink>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------------- Plans */}
      <Section id="plans" labelledBy="plans-heading">
        <Container size="wide">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5">
              <Kicker tone="gold">Membership plans</Kicker>
              <h2 id="plans-heading" className="max-w-[14ch] font-display text-[clamp(40px,6.4vw,92px)] font-medium leading-[0.94] tracking-[-0.05em] text-[var(--fg)]">
                Pick your <AccentText tone="gold">lane.</AccentText>
              </h2>
            </div>
            <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)]">Proposed plans — subject to confirmation</p>
          </div>

          <ul className="mt-14 grid gap-5 lg:grid-cols-3">
            {MEMBERSHIP_PLANS.map((plan, i) => (
              <Reveal as="li" key={plan.key} delay={i * 100} className="h-full">
                <article
                  className={cn(
                    'shine relative flex h-full flex-col gap-7 overflow-hidden rounded-[30px] border p-7 md:p-9',
                    plan.featured ? 'grain border-gold/50 bg-grad-surface shadow-[0_30px_80px_-40px_rgb(var(--gold-rgb)/0.6)] lg:-translate-y-4' : 'border-mist/[0.1] bg-grad-surface'
                  )}
                  aria-labelledby={`plan-${plan.key}`}
                >
                  {plan.featured && (
                    <>
                      <div className="aurora opacity-50" aria-hidden>
                        <i />
                      </div>
                      <span className="absolute right-6 top-6 z-10 rounded-full bg-grad-gold px-3 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-950">
                        Most popular
                      </span>
                    </>
                  )}
                  <div className="relative z-10 flex flex-col gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{plan.audience}</span>
                    <h3 id={`plan-${plan.key}`} className="font-display text-[34px] font-medium leading-none tracking-[-0.04em] text-[var(--fg)]">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="relative z-10 flex flex-wrap items-baseline gap-x-2">
                    <span className={cn('font-display text-[clamp(56px,6vw,80px)] font-semibold leading-none tracking-[-0.05em]', plan.featured ? 'text-gold-gradient' : 'text-[var(--fg)]')}>
                      ₹{plan.price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[15px] text-[var(--muted)]">/ {plan.period}</span>
                    {plan.priceNote && <span className="w-full pt-2 font-serif text-[18px] italic text-gold-soft">{plan.priceNote}</span>}
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Ideal for</h4>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {plan.idealFor.map((x) => (
                        <li key={x} className="rounded-full border border-mist/[0.12] px-2.5 py-1 text-[12.5px] text-[var(--fg)]">
                          {x}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative z-10 border-t border-[var(--line)] pt-6">
                    <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Benefits</h4>
                    <ul className="mt-4 grid gap-2.5">
                      {plan.benefits.map((b) => (
                        <li key={b} className="flex gap-3 text-[14.5px] text-[var(--fg)]">
                          <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.featured ? 'text-gold' : 'text-brand-200')} aria-hidden />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative z-10 mt-auto pt-2">
                    <PillLink href={`/join?plan=${plan.key}#register`} variant={plan.featured ? 'gold' : 'ghost'} className="w-full">
                      Choose {plan.name}
                    </PillLink>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Benefits */}
      <Section className="border-y border-[var(--line)] bg-grad-surface" labelledBy="benefits-heading">
        <Container size="wide">
          <div className="flex flex-col gap-5">
            <Kicker>Why join</Kicker>
            <h2 id="benefits-heading" className="max-w-[16ch] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--fg)]">
              More than a <AccentText>membership card.</AccentText>
            </h2>
          </div>
          <ul className="mt-14 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_JOIN.map((w, i) => {
              const Icon = WHY_ICONS[w.key];
              const big = i === 0 || i === 5;
              return (
                <Reveal
                  as="li"
                  key={w.key}
                  delay={(i % 4) * 80}
                  className={cn(
                    'group flex flex-col justify-between gap-10 rounded-[28px] border p-7 transition-transform duration-500 hover:-translate-y-1',
                    big ? 'border-gold/25 bg-gold/[0.06] lg:col-span-2' : 'border-mist/[0.1] bg-bg/60'
                  )}
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15 text-brand-200 transition-transform duration-500 group-hover:rotate-[-8deg]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className={cn('font-display font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]', big ? 'text-[34px]' : 'text-[24px]')}>{w.title}</h3>
                    <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">{w.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Identities */}
      <section aria-labelledby="identities-heading" className="overflow-hidden py-[clamp(64px,8vw,112px)]">
        <Container size="wide" className="mb-10 flex flex-col gap-4">
          <Kicker tone="gold">Who it’s for</Kicker>
          <h2 id="identities-heading" className="font-display text-[clamp(32px,4.4vw,56px)] font-medium leading-[1.02] tracking-[-0.04em] text-[var(--fg)]">
            Every kind of CA. <AccentText tone="gold">And beyond.</AccentText>
          </h2>
        </Container>
        <div className="flex flex-col gap-4">
          <Marquee duration={42} gap="1rem" ariaLabel="CA member identities">
            {MEMBER_IDENTITIES.ca.map((x) => (
              <span key={x} className="whitespace-nowrap rounded-full border border-gold/30 bg-gold/[0.07] px-6 py-3 font-display text-[clamp(20px,2.4vw,32px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
                {x}
              </span>
            ))}
          </Marquee>
          <Marquee duration={48} gap="1rem" reverse ariaLabel="Allied professional identities">
            {MEMBER_IDENTITIES.allied.map((x) => (
              <span key={x} className="whitespace-nowrap rounded-full border border-mist/[0.14] px-6 py-3 font-display text-[clamp(20px,2.4vw,32px)] font-medium tracking-[-0.03em] text-[var(--muted)]">
                {x}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Journey */}
      <Section className="grain overflow-hidden border-y border-[var(--line)]" labelledBy="journey-heading">
        <div className="aurora opacity-40" aria-hidden>
          <i />
        </div>
        <Container size="wide" className="relative z-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5">
              <Kicker>The member journey</Kicker>
              <h2 id="journey-heading" className="max-w-[14ch] font-display text-[clamp(44px,7.5vw,112px)] font-medium leading-[0.9] tracking-[-0.055em] text-[var(--fg)]">
                From hello to <AccentText tone="hero">leader.</AccentText>
              </h2>
            </div>
            <p className="max-w-[40ch] text-[16px] leading-relaxed text-[var(--muted)]">Nine steps. Most people take the first three in a week — the rest is where it gets interesting.</p>
          </div>

          <ol className="relative mt-16 grid gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBER_JOURNEY.map((step, i) => {
              const last = i === MEMBER_JOURNEY.length - 1;
              return (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={(i % 3) * 110}
                  className={cn(
                    'group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[28px] border p-7 transition-transform duration-500 hover:-translate-y-1.5',
                    last ? 'border-gold/50 bg-gold/[0.08] sm:col-span-2 lg:col-span-1' : 'border-mist/[0.1] bg-bg/70 backdrop-blur',
                    i % 3 === 1 && 'lg:translate-y-10',
                    i % 3 === 2 && 'lg:translate-y-20'
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'pointer-events-none absolute -right-3 -top-8 select-none font-display text-[150px] font-semibold leading-none tracking-[-0.06em] transition-transform duration-700 group-hover:-translate-x-2',
                      last ? 'text-gold-gradient opacity-90' : 'text-outline opacity-60'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="relative font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Step {String(i + 1).padStart(2, '0')}</span>
                  <div className="relative">
                    <h3 className="font-display text-[28px] font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]">{step.title}</h3>
                    <p className="mt-2 max-w-[32ch] text-[14.5px] leading-relaxed text-[var(--muted)]">{step.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
          <div className="h-20" aria-hidden />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Registration form */}
      <Section id="register" labelledBy="register-heading">
        <Container size="wide" className="grid gap-12 lg:grid-cols-[0.8fr_1.6fr]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <Kicker tone="gold">Member registration</Kicker>
            <h2 id="register-heading" className="font-display text-[clamp(40px,5.6vw,80px)] font-medium leading-[0.94] tracking-[-0.05em] text-[var(--fg)]">
              Let’s get you <AccentText tone="gold">in.</AccentText>
            </h2>
            <p className="text-[16px] leading-relaxed text-[var(--muted)]">
              Tell us a little about yourself. Our membership team reviews every application and gets back to you with your plan and payment details.
            </p>
            <ul className="flex flex-col gap-3 text-[14px] text-[var(--muted)]">
              {['Takes about two minutes', 'No payment is taken on this form', 'Your details stay private'].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-gold" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] border border-mist/[0.1] bg-grad-surface p-6 sm:p-8 md:p-12">
            <JoinForm
              key={initialPlan ?? "none"}
              initialPlan={initialPlan}
              wings={wings}
              plans={MEMBERSHIP_PLANS.map((p) => ({ key: p.key, name: p.name, audience: p.audience, priceLabel: priceLabel(p) }))}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
