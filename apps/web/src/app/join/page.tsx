import React from 'react';
import type { Metadata } from 'next';
import { Briefcase, Check, ChevronDown, GraduationCap, Handshake, Lightbulb, Rocket, Users } from 'lucide-react';
import {
  MEMBERSHIP_PLANS,
  membershipFeeFor,
  MEMBER_IDENTITIES,
  MEMBER_JOURNEY,
  ORG_POSITIONING,
  wingSlug,
  WHY_JOIN,
  type CommunityWing,
  type MembershipPlan,
} from '@ascend/shared';
import { AccentText, Container, Kicker, cn } from '@ascend/ui';
import { Marquee, Reveal } from '../../components/ui-client';
import { getItems, getSettings } from '../../lib/community-store';
import { PageHero, PillLink, Section } from '../../components/content/ui';
import { JoinForm } from '../../components/content/JoinForm';
import { FxCard } from '../../components/home/Interactive';
import { siteWings, wingCountWords } from '../../lib/taxonomy';

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
  return `₹${p.price.toLocaleString('en-IN')} / ${p.period}`;
}

type PlanKey = MembershipPlan['key'];

export default async function JoinPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const requested = typeof sp.plan === 'string' ? sp.plan : undefined;
  const initialPlan = MEMBERSHIP_PLANS.some((p) => p.key === requested) ? (requested as PlanKey) : undefined;
  const orgWings = siteWings();
  const requestedWing = typeof sp.wing === 'string' ? orgWings.find((w) => wingSlug(w.name) === sp.wing) : undefined;

  const storeWings = getItems<CommunityWing>('wings', true);
  // Annual fees come from Site Settings (defaults: the Blueprint prices).
  const settingsForFees = getSettings();
  const plans = MEMBERSHIP_PLANS.map((p) => ({ ...p, price: membershipFeeFor(p.key, settingsForFees) }));
  const wings = orgWings.map((w) => ({
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
        lead={`One membership. ${wingCountWords(orgWings.length)}, a Pan-India city network and a year-round calendar to help you learn, connect, grow and lead.`}
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
            <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)]">Annual fees · pay after your application is approved · valid 12 months</p>
          </div>

          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const top = plan.benefits.slice(0, 4);
              const more = plan.benefits.slice(4);
              return (
                <Reveal as="li" key={plan.key} delay={i * 100} className={cn('h-full', plan.featured && 'md:col-span-2 lg:col-span-1')}>
                  <FxCard
                    as="article"
                    max={6}
                    className={cn(
                      'group flex h-full flex-col gap-5 rounded-[28px] p-3',
                      plan.featured
                        ? 'border border-transparent [background:var(--grad-surface)_padding-box,linear-gradient(160deg,rgb(var(--gold-rgb)/0.75),rgb(var(--brand-300-rgb)/0.35)_45%,rgb(var(--gold-rgb)/0.5))_border-box] shadow-[0_30px_80px_-45px_rgb(var(--gold-rgb)/0.7)]'
                        : 'border border-mist/[0.1] bg-grad-surface'
                    )}
                  >
                    {plan.featured && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                      />
                    )}
                    {/* The plan as a membership card */}
                    <div
                      className={cn(
                        'holo grain relative flex aspect-[1.75/1] flex-col justify-between overflow-hidden rounded-[20px] border p-5',
                        plan.featured ? 'border-gold/50 shadow-[0_24px_60px_-30px_rgb(var(--gold-rgb)/0.8)]' : 'border-mist/[0.14]'
                      )}
                    >
                      <div
                        aria-hidden
                        className="mesh-drift"
                        style={{
                          background: plan.featured
                            ? 'radial-gradient(55% 75% at 75% 25%, rgb(var(--gold-rgb) / 0.6), transparent 70%), radial-gradient(45% 60% at 20% 90%, rgb(var(--lime-rgb) / 0.45), transparent 70%), linear-gradient(140deg, var(--brand-800), var(--brand-950))'
                            : `radial-gradient(55% 75% at 75% 25%, rgb(var(--lime-rgb) / ${i === 1 ? 0.65 : 0.5}), transparent 70%), radial-gradient(45% 60% at 20% 90%, rgb(var(--gold-rgb) / 0.25), transparent 70%), linear-gradient(140deg, var(--brand-800), var(--brand-950))`,
                          animationDelay: `${-i * 4}s`,
                        }}
                      />
                      <span
                        aria-hidden
                        className="fx-ghost text-outline pointer-events-none absolute -bottom-8 right-2 select-none font-display text-[150px] font-semibold leading-none tracking-[-0.06em] opacity-60"
                      >
                        {plan.name.slice(0, 1)}
                      </span>
                      <div className="relative flex items-start justify-between gap-3">
                        <span aria-hidden className="h-7 w-10 rounded-md bg-grad-gold opacity-90 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]" />
                        {plan.featured ? (
                          <span className="rounded-full bg-grad-gold px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-950">
                            Most popular
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">ASCEND</span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/70">{plan.audience}</span>
                        <h3 id={`plan-${plan.key}`} className="mt-1 font-display text-[24px] font-medium leading-none tracking-[-0.035em] text-white">
                          {plan.name}
                        </h3>
                        <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5">
                          <span
                            className={cn(
                              'font-display text-[clamp(34px,3.4vw,44px)] font-semibold leading-none tracking-[-0.05em]',
                              plan.featured ? 'text-gold-gradient' : 'text-white'
                            )}
                          >
                            ₹{plan.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[13px] text-white/70">/ {plan.period}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 px-3 pb-3">
                      <div>
                        <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Ideal for</h4>
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {plan.idealFor.map((x) => (
                            <li key={x} className="rounded-full border border-mist/[0.12] px-2.5 py-0.5 text-[12px] text-[var(--fg)]">
                              {x}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-[var(--line)] pt-4">
                        <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Benefits</h4>
                        <ul className="mt-2.5 grid gap-1.5">
                          {top.map((b) => (
                            <li key={b} className="flex gap-2.5 text-[13.5px] leading-snug text-[var(--fg)]">
                              <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.featured ? 'text-gold' : 'text-brand-200')} aria-hidden />
                              {b}
                            </li>
                          ))}
                        </ul>
                        {more.length > 0 && (
                          <details className="mt-1.5 [&[open]_.chev]:rotate-180">
                            <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-full py-1 text-[13px] font-semibold text-brand-200 hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 [&::-webkit-details-marker]:hidden">
                              All {plan.benefits.length} benefits
                              <ChevronDown className="chev h-4 w-4 transition-transform duration-300" aria-hidden />
                            </summary>
                            <ul className="mt-1.5 grid gap-1.5">
                              {more.map((b) => (
                                <li key={b} className="flex gap-2.5 text-[13.5px] leading-snug text-[var(--fg)]">
                                  <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.featured ? 'text-gold' : 'text-brand-200')} aria-hidden />
                                  {b}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>

                      <div className="mt-auto pt-1">
                        <PillLink href={`/join?plan=${plan.key}#register`} variant={plan.featured ? 'gold' : 'ghost'} className="w-full whitespace-nowrap text-[14px]">
                          Choose {plan.name}
                        </PillLink>
                      </div>
                    </div>
                  </FxCard>
                </Reveal>
              );
            })}
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
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_JOIN.map((w, i) => {
              const Icon = WHY_ICONS[w.key];
              const big = i === 0 || i === 5;
              return (
                <Reveal as="li" key={w.key} delay={(i % 4) * 80} className={cn('h-full', big && 'lg:col-span-2')}>
                  <FxCard
                    max={6}
                    className={cn(
                      'group flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[24px] border p-6',
                      big ? 'border-gold/25 bg-gold/[0.06]' : 'border-mist/[0.1] bg-bg/60'
                    )}
                  >
                    <span
                      aria-hidden
                      className="fx-ghost text-outline pointer-events-none absolute -right-1 -top-5 select-none font-display text-[96px] font-semibold leading-none tracking-[-0.06em] opacity-40"
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="fx-icon relative grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="relative">
                      <h3 className={cn('font-display font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]', big ? 'text-[28px]' : 'text-[22px]')}>{w.title}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{w.text}</p>
                    </div>
                  </FxCard>
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

          <ol className="relative mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBER_JOURNEY.map((step, i) => {
              const last = i === MEMBER_JOURNEY.length - 1;
              return (
                <Reveal as="li" key={step.title} delay={(i % 3) * 90} className="h-full">
                  <FxCard
                    max={6}
                    className={cn(
                      'group flex h-full gap-4 overflow-hidden rounded-[24px] border p-5',
                      last ? 'border-gold/50 bg-gold/[0.08]' : 'border-mist/[0.1] bg-bg/70 backdrop-blur'
                    )}
                  >
                    <span
                      className={cn(
                        'fx-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-[20px] font-semibold',
                        last ? 'bg-grad-gold text-brand-950' : 'bg-brand-500/15 text-brand-200'
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="relative min-w-0">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold">Step {String(i + 1).padStart(2, '0')}</span>
                      <h3 className="mt-1 font-display text-[22px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)]">{step.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">{step.text}</p>
                    </div>
                  </FxCard>
                </Reveal>
              );
            })}
          </ol>
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
              key={`${initialPlan ?? 'none'}-${requestedWing?.number ?? 0}`}
              initialPlan={initialPlan}
              initialWings={requestedWing ? [requestedWing.number] : undefined}
              wings={wings}
              plans={plans.map((p) => ({ key: p.key, name: p.name, audience: p.audience, priceLabel: priceLabel(p) }))}
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
