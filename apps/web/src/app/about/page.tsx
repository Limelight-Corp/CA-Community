import React from 'react';
import type { Metadata } from 'next';
import {
  Award,
  BadgeCheck,
  Building2,
  Cpu,
  Crown,
  Eye,
  GraduationCap,
  HandHelping,
  Handshake,
  HeartPulse,
  Landmark,
  Linkedin,
  Network,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  ORG_COMMUNITIES,
  ORG_CORE_PURPOSES,
  ORG_FOCUS_AREAS,
  ORG_GUIDING_PRINCIPLES,
  ORG_MISSION,
  ORG_POSITIONING,
  ORG_STRUCTURE,
  ORG_TAGLINE,
  ORG_VISION,
  ORG_VISION_STATEMENT,
  ORG_WINGS,
  MEMBER_JOURNEY,
  type CommunityTeamMember,
  type CommunityWing,
} from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker, SectionHeading, cn } from '@ascend/ui';
import { CountUp, Marquee, Reveal } from '../../components/ui-client';
import { FxCard } from '../../components/home/Interactive';
import { FlipCard, InView, ScrollHighlight } from '../../components/about/AboutFx';
import { getItems, getSettings } from '../../lib/community-store';
import { jsonLd, siteUrl } from '../../lib/seo';
import { safeUrl } from '../../lib/content';
import { CtaBand, PageHero, PillLink, Section } from '../../components/content/ui';
import { WingsExplorer, type WingView } from '../../components/content/WingsExplorer';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'About Us',
    description: `${siteName} is ${ORG_POSITIONING.title.toLowerCase()} ${ORG_POSITIONING.titleAccent.toLowerCase()} — vision, mission, leadership, organisation structure and the 10 professional wings.`,
    alternates: { canonical: '/about' },
  };
}

const TEAM_GROUPS: CommunityTeamMember['group'][] = [
  'Leadership',
  'Core Team',
  'Wing Conveners',
  'Advisory Board',
];
const GROUP_LEAD: Record<CommunityTeamMember['group'], string> = {
  Leadership: 'The office bearers steering the community.',
  'Core Team': 'The people running programmes, cities and operations.',
  'Wing Conveners': 'One convener leads each professional wing.',
  'Advisory Board': 'Senior professionals guiding the community’s direction.',
};

const PURPOSE_ICONS: Record<string, LucideIcon> = {
  learn: GraduationCap,
  connect: Users,
  grow: TrendingUp,
  transform: Cpu,
  thrive: HeartPulse,
  contribute: HandHelping,
};

const COMMUNITY_ICONS: LucideIcon[] = [
  Building2,
  Award,
  GraduationCap,
  Sparkles,
  Network,
  Handshake,
];

export default function AboutPage() {
  const settings = getSettings();
  const team = getItems<CommunityTeamMember>('team', true).sort((a, b) => a.order - b.order);
  const storeWings = getItems<CommunityWing>('wings', true);

  const wings: WingView[] = ORG_WINGS.map((w) => ({
    number: w.number,
    name: w.name,
    focus: w.focus,
    activities: w.activities,
    color: storeWings.find((s) => s.number === w.number)?.color || 'var(--brand-500)',
  }));

  const groups = TEAM_GROUPS.map((g) => ({
    group: g,
    members: team.filter((m) => m.group === g),
  })).filter((g) => g.members.length > 0);

  // Named holders come from the documents first, then from published team profiles with the same designation.
  const holderFor = (role: string, docHolder?: string) =>
    docHolder || team.find((m) => m.designation.trim().toLowerCase() === role.toLowerCase())?.name;
  const photoFor = (name?: string) =>
    name ? safeUrl(team.find((m) => m.name === name)?.photoUrl) : undefined;

  const orgNodes = ORG_STRUCTURE.map((n) => {
    const holder = holderFor(n.role, 'holder' in n ? n.holder : undefined);
    return {
      role: n.role,
      holder,
      photo: photoFor(holder),
      note: 'note' in n ? n.note : undefined,
    };
  });

  const youngWing = ORG_WINGS.find((w) => w.number === 6);
  const sameAs = Object.values(settings.social)
    .map((u) => safeUrl(u))
    .filter((u): u is string => !!u && /^https?:/.test(u));

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: siteUrl(),
    logo: `${siteUrl()}/icon.svg`,
    description: `${ORG_POSITIONING.title} ${ORG_POSITIONING.titleAccent}. ${ORG_POSITIONING.idea}`,
    ...(sameAs.length ? { sameAs } : {}),
  };

  const stats = [
    { value: ORG_WINGS.length, label: 'Professional wings' },
    {
      value: ORG_WINGS.reduce((s, w) => s + w.activities.length, 0),
      label: 'Proposed activity formats',
    },
    { value: ORG_COMMUNITIES.length, label: 'Community structures' },
    { value: MEMBER_JOURNEY.length, label: 'Steps from member to leader' },
    { value: ORG_GUIDING_PRINCIPLES.length, label: 'Guiding principles' },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(orgLd) }} />

      {/* ---------------------------------------------------------------- Hero */}
      <PageHero
        eyebrow={`About ${settings.siteName} · ${ORG_POSITIONING.launchLabel}`}
        title={ORG_POSITIONING.title}
        accent={ORG_POSITIONING.titleAccent}
        lead={ORG_POSITIONING.idea}
        ghost={settings.siteName}
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <PillLink href="/join" variant="gold">
            Become a member
          </PillLink>
          <PillLink href="#structure" variant="ghost">
            See the organisation
          </PillLink>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------------- Stats strip */}
      <section aria-label="At a glance" className="relative -mt-6 pb-10 md:-mt-10">
        <Container size="wide">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {stats.map((s, i) => (
              <Reveal
                as="li"
                key={s.label}
                delay={i * 70}
                className={cn(i === 0 && 'col-span-2 md:col-span-1')}
              >
                <FxCard
                  className={cn(
                    'h-full overflow-hidden rounded-[24px] border p-5 md:p-6',
                    i === 0
                      ? 'border-transparent bg-grad-primary'
                      : 'border-mist/[0.1] bg-grad-surface'
                  )}
                >
                  <CountUp
                    value={s.value}
                    className="block font-display text-[clamp(44px,5vw,64px)] font-semibold leading-none tracking-[-0.05em] text-white [text-shadow:0_0_30px_rgb(var(--lime-rgb)/0.45)]"
                  />
                  <span
                    className={cn(
                      'mt-2 block text-[13px]',
                      i === 0 ? 'text-white/80' : 'text-[var(--muted)]'
                    )}
                  >
                    {s.label}
                  </span>
                  <span
                    aria-hidden
                    className="fx-ghost absolute -bottom-10 -right-6 h-28 w-28 rounded-full bg-gold/25 opacity-50 blur-2xl"
                  />
                </FxCard>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---------------------------------------------------------------- Pillars marquee */}
      <div className="border-y border-[var(--line)] py-6">
        <Marquee duration={36} gap="2.5rem" ariaLabel="Our six pillars">
          {ORG_CORE_PURPOSES.map((p, i) => (
            <span
              key={p.key}
              className="flex items-center gap-10 font-display text-[clamp(40px,6vw,88px)] font-medium leading-none tracking-[-0.05em]"
            >
              <span className={i % 2 ? 'text-outline' : 'text-[var(--fg)]'}>{p.title}.</span>
              <Sparkles className="h-8 w-8 shrink-0 text-gold" aria-hidden />
            </span>
          ))}
        </Marquee>
      </div>

      {/* ---------------------------------------------------------------- Vision & mission */}
      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="Vision & mission" title="Why we" accent="exist." size="lg" />
          <div className="mt-12 grid gap-4 md:mt-14 md:gap-5 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <FxCard
                max={4}
                className="grain h-full overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface p-7 md:p-12"
              >
                <div className="aurora opacity-60" aria-hidden>
                  <i />
                </div>
                <div className="relative z-10 flex h-full flex-col gap-8">
                  <div className="flex items-center justify-between">
                    <Kicker>Our vision</Kicker>
                    <span className="fx-icon grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/20 text-brand-100">
                      <Eye className="h-6 w-6" aria-hidden />
                    </span>
                  </div>
                  <p className="text-balance font-display text-[clamp(24px,3.2vw,44px)] font-medium leading-[1.08] tracking-[-0.035em] text-[var(--fg)]">
                    {ORG_VISION}
                  </p>
                </div>
              </FxCard>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-5">
              <FxCard
                max={4}
                className="flex h-full flex-col gap-8 overflow-hidden rounded-[28px] border border-gold/25 bg-gold/[0.06] p-7 md:p-12"
              >
                <div className="flex items-center justify-between">
                  <Kicker tone="gold">Our mission</Kicker>
                  <span className="fx-icon grid h-12 w-12 place-items-center rounded-2xl bg-grad-gold text-brand-950">
                    <Target className="h-6 w-6" aria-hidden />
                  </span>
                </div>
                <blockquote className="font-serif text-[clamp(22px,2.4vw,34px)] italic leading-[1.2] text-[var(--fg)]">
                  “{ORG_MISSION}”
                </blockquote>
              </FxCard>
            </Reveal>
          </div>

          {/* Vision statement lights up word by word on scroll */}
          <div className="mt-16 grid gap-6 md:mt-24 lg:grid-cols-[0.6fr_2fr]">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">
              Vision statement
            </span>
            <div>
              <ScrollHighlight
                text={ORG_VISION_STATEMENT}
                highlight={['connected,', 'future-ready', 'thriving', 'opportunities']}
                className="font-display text-[clamp(30px,4.6vw,68px)] font-medium leading-[1.04] tracking-[-0.045em] text-[var(--fg)]"
              />
              <p className="mt-8 font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">
                {ORG_TAGLINE.split('.')[0]}.{' '}
                <AccentText tone="gold">
                  {ORG_TAGLINE.split('.').slice(1).join('.').trim()}
                </AccentText>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Built for young CAs */}
      <Section
        className="relative overflow-hidden border-y border-[var(--line)] bg-grad-surface"
        labelledBy="young-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-brand-500/20 blur-[120px]"
        />
        <Container size="wide" className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <Kicker tone="gold">Why it was created</Kicker>
            <h2
              id="young-heading"
              className="font-display text-[clamp(38px,6vw,88px)] font-medium leading-[0.92] tracking-[-0.05em] text-[var(--fg)]"
            >
              Built for the <AccentText tone="hero">next generation</AccentText> of the profession.
            </h2>
            <p className="max-w-[56ch] text-[17px] leading-relaxed text-[var(--muted)]">
              {ORG_POSITIONING.summary} — with opportunities all year round, not once a year. Young
              CAs and students aren’t an afterthought here: they have their own wing, their own city
              leads, dedicated young professional coordinators and a student membership.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {[
              {
                icon: GraduationCap,
                k: `Wing ${String(youngWing?.number ?? 6).padStart(2, '0')}`,
                v: youngWing?.name ?? 'Young Professionals & Career',
                d: youngWing?.focus.join(' · '),
              },
              {
                icon: Users,
                k: 'Community',
                v: 'Young CA Leads',
                d: 'City-wise young CA representatives, mentorship & leadership initiatives',
              },
              {
                icon: BadgeCheck,
                k: 'Structure',
                v: 'Young Professional Coordinators',
                d: 'Built into the core executive structure',
              },
              {
                icon: Award,
                k: 'Membership',
                v: 'Student Member plan',
                d: 'Mentorship, career guidance and selected free webinars',
              },
            ].map((item, i) => (
              <Reveal as="li" key={item.v} delay={i * 80}>
                <FxCard className="h-full overflow-hidden rounded-[24px] border border-mist/[0.1] bg-bg/60 p-6 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
                      {item.k}
                    </span>
                    <span className="fx-icon grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-200">
                      <item.icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                  <p className="mt-4 font-display text-[22px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)]">
                    {item.v}
                  </p>
                  {item.d && (
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">
                      {item.d}
                    </p>
                  )}
                </FxCard>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Objectives (flip cards) */}
      <Section labelledBy="objectives-heading">
        <Container size="wide">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-5">
              <Kicker>Objectives</Kicker>
              <h2
                id="objectives-heading"
                className="max-w-[16ch] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--fg)]"
              >
                Six things we <AccentText>show up for.</AccentText>
              </h2>
            </div>
            <p className="max-w-[34ch] text-[14.5px] text-[var(--muted)]">
              Hover — or tap on mobile — to flip a card.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
            {ORG_CORE_PURPOSES.map((p, i) => {
              const Icon = PURPOSE_ICONS[p.key] ?? Sparkles;
              const gold = i === 0 || i === 4;
              return (
                <Reveal as="li" key={p.key} delay={(i % 3) * 90}>
                  <FlipCard
                    label={p.title}
                    className="h-[260px] rounded-[28px] md:h-[300px]"
                    front={
                      <span
                        className={cn(
                          'flex h-full flex-col justify-between rounded-[28px] border p-7',
                          gold
                            ? 'border-gold/30 bg-gold/[0.07]'
                            : 'border-mist/[0.1] bg-grad-surface'
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--muted)]">
                            {String(i + 1).padStart(2, '0')} / 06
                          </span>
                          <span
                            className={cn(
                              'grid h-12 w-12 place-items-center rounded-2xl',
                              gold
                                ? 'bg-grad-gold text-brand-950'
                                : 'bg-brand-500/15 text-brand-200'
                            )}
                          >
                            <Icon className="h-6 w-6" aria-hidden />
                          </span>
                        </span>
                        <span className="block font-display text-[clamp(48px,5vw,72px)] font-medium leading-none tracking-[-0.05em] text-[var(--fg)]">
                          {p.title}
                          <span className="text-gold">.</span>
                        </span>
                      </span>
                    }
                    back={
                      <span className="grain relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] bg-grad-primary p-7">
                        <span
                          aria-hidden
                          className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/35 blur-[70px]"
                        />
                        <span className="relative flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white">
                            <Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="font-display text-[26px] font-medium tracking-[-0.03em] text-white">
                            {p.title}
                          </span>
                        </span>
                        <span className="relative block font-display text-[clamp(22px,2.2vw,30px)] font-medium leading-[1.15] tracking-[-0.03em] text-white">
                          {p.text}
                        </span>
                      </span>
                    }
                  />
                </Reveal>
              );
            })}
          </ol>

          {/* Focus areas */}
          <div className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_2fr]">
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-[32px] font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]">
                Focus areas
              </h3>
              <p className="text-[15px] leading-relaxed text-[var(--muted)]">
                Five areas that shape every programme, wing and city chapter.
              </p>
            </div>
            <ul className="border-t border-[var(--line)]">
              {ORG_FOCUS_AREAS.map((f, i) => (
                <li
                  key={f.title}
                  className="group relative overflow-hidden border-b border-[var(--line)]"
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-gold/[0.12] via-brand-500/[0.08] to-transparent transition-transform duration-700 ease-out group-hover:scale-x-100"
                  />
                  <div className="relative grid gap-2 py-6 sm:grid-cols-[4rem_1fr_1.2fr] sm:items-baseline sm:gap-6">
                    <span className="font-display text-[28px] font-semibold leading-none tracking-[-0.04em] text-gold transition-transform duration-500 group-hover:scale-125">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)] transition-transform duration-500 group-hover:translate-x-2">
                      {f.title}
                    </span>
                    <span className="text-[14.5px] leading-relaxed text-[var(--muted)]">
                      {f.text}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Guiding principles */}
      <section
        className="overflow-hidden border-y border-[var(--line)] py-16 md:py-20"
        aria-labelledby="principles-heading"
      >
        <Container size="wide" className="mb-8">
          <Kicker tone="gold">Guiding principles</Kicker>
          <h2 id="principles-heading" className="sr-only">
            Guiding principles
          </h2>
        </Container>
        <div className="flex flex-col gap-4">
          <Marquee duration={30} gap="1rem">
            {ORG_GUIDING_PRINCIPLES.map((p, i) => (
              <span
                key={p}
                className={cn(
                  'whitespace-nowrap rounded-full border px-7 py-4 font-display text-[clamp(24px,3.6vw,48px)] font-medium tracking-[-0.04em] transition-colors',
                  i % 2
                    ? 'border-gold/30 bg-gold/[0.06] text-[var(--fg)]'
                    : 'border-mist/[0.12] text-outline hover:text-[var(--fg)]'
                )}
              >
                {p}
              </span>
            ))}
          </Marquee>
          <Marquee duration={34} gap="1rem" reverse>
            {[...ORG_GUIDING_PRINCIPLES].reverse().map((p, i) => (
              <span
                key={p}
                className={cn(
                  'whitespace-nowrap rounded-full border px-7 py-4 font-display text-[clamp(24px,3.6vw,48px)] font-medium tracking-[-0.04em]',
                  i % 2
                    ? 'border-mist/[0.12] bg-brand-500/10 text-[var(--fg)]'
                    : 'border-mist/[0.12] text-[var(--muted)]'
                )}
              >
                {p}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Leadership */}
      <Section id="leadership" labelledBy="leadership-heading">
        <Container size="wide">
          <div className="flex flex-col gap-5">
            <Kicker>Leadership & team</Kicker>
            <h2
              id="leadership-heading"
              className="max-w-[18ch] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--fg)]"
            >
              The people <AccentText tone="gold">behind it.</AccentText>
            </h2>
          </div>

          {groups.length === 0 ? (
            <p className="mt-10 text-[var(--muted)]">Team profiles will be published soon.</p>
          ) : (
            <div className="mt-12 flex flex-col gap-16 md:mt-14">
              {groups.map(({ group, members }) => (
                <div key={group} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="font-display text-[26px] font-medium tracking-[-0.03em] text-[var(--fg)]">
                      {group}
                    </h3>
                    <p className="text-[14px] text-[var(--muted)]">{GROUP_LEAD[group]}</p>
                  </div>
                  <ul
                    className={cn(
                      'grid gap-5',
                      group === 'Leadership' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
                    )}
                  >
                    {members.map((m, i) => (
                      <Reveal as="li" key={m.id} delay={(i % 3) * 90}>
                        <TeamCard member={m} large={group === 'Leadership'} />
                      </Reveal>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Organisation tree */}
      <Section
        id="structure"
        className="relative overflow-hidden border-y border-[var(--line)] bg-grad-surface"
      >
        <div className="grid-lines absolute inset-0 opacity-70" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/10 blur-[130px]"
        />
        <Container size="wide" className="relative">
          <SectionHeading
            eyebrow="Organisation structure"
            title="How the community"
            accent="is organised."
            align="center"
            className="mx-auto"
            lead="Core leadership and executive structure, from the office bearers to every member of the forum."
          />
          <OrgTree nodes={orgNodes} />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Wings */}
      <Section id="wings" labelledBy="wings-heading">
        <Container size="wide">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5">
              <Kicker tone="gold">10 professional wings</Kicker>
              <h2
                id="wings-heading"
                className="max-w-[14ch] font-display text-[clamp(44px,7.5vw,112px)] font-medium leading-[0.9] tracking-[-0.055em] text-[var(--fg)]"
              >
                Ten wings. <AccentText tone="hero">One community.</AccentText>
              </h2>
            </div>
            <p className="max-w-[44ch] text-[16px] leading-relaxed text-[var(--muted)]">
              Each wing is led by a convener and a wing committee, running year-round formats that
              build up to an annual summit. Tap a wing to see its focus areas and proposed
              activities.
            </p>
          </div>
          <div className="mt-14">
            <WingsExplorer wings={wings} />
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Parallel communities */}
      <Section className="border-t border-[var(--line)]">
        <Container size="wide">
          <SectionHeading
            eyebrow="Parallel community structures"
            title="Communities inside"
            accent="the community."
            lead="Alongside the wings, these networks give every member a home — by city, experience, stage and profession."
          />
          <ul className="mt-12 grid gap-4 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {ORG_COMMUNITIES.map((c, i) => {
              const Icon = COMMUNITY_ICONS[i] ?? Users;
              const gold = i === 2 || i === 3;
              return (
                <Reveal as="li" key={c.name} delay={(i % 3) * 90}>
                  <FxCard
                    className={cn(
                      'group flex h-full flex-col gap-5 overflow-hidden rounded-[28px] border p-7',
                      gold ? 'border-gold/25 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="mt-3 font-display text-[28px] font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]">
                          {c.name}
                        </h3>
                        <p className="mt-1 text-[13.5px] text-brand-200">{c.subtitle}</p>
                      </div>
                      <span
                        className={cn(
                          'fx-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl',
                          gold ? 'bg-grad-gold text-brand-950' : 'bg-brand-500/15 text-brand-200'
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                    </div>
                    <ul className="mt-auto flex flex-col gap-2 border-t border-[var(--line)] pt-4">
                      {c.points.map((p, j) => (
                        <li
                          key={p}
                          className="flex gap-2.5 text-[14px] text-[var(--muted)] transition-transform duration-500 group-hover:translate-x-1"
                          style={{ transitionDelay: `${j * 40}ms` }}
                        >
                          <span
                            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                            aria-hidden
                          />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </FxCard>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </Section>

      <CtaBand
        title="Your seat is"
        accent="waiting."
        lead="Join as a founding member ahead of the Pan-India launch, or start with an event."
        primary={{ href: '/join', label: 'Join the community' }}
        secondary={{ href: '/events', label: 'See upcoming events' }}
      />
    </>
  );
}

function TeamCard({ member, large }: { member: CommunityTeamMember; large?: boolean }) {
  const linkedin = safeUrl(member.linkedinUrl);
  const photo = safeUrl(member.photoUrl);
  return (
    <FxCard
      max={6}
      className={cn(
        'grain flex h-full gap-6 overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface p-6',
        large ? 'flex-col sm:flex-row sm:items-center md:p-8' : 'flex-col'
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-brand-500/25 blur-[80px]"
      />
      <span className="ring-spin relative inline-flex w-fit shrink-0 self-start rounded-[26px] sm:self-center">
        <Avatar
          name={member.name}
          src={photo}
          size={large ? 132 : 88}
          rounded="xl"
          className="rounded-[24px] border-4 border-bg"
        />
      </span>
      <div className="relative flex min-w-0 flex-1 flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">
          <Crown className="h-3.5 w-3.5" aria-hidden />
          {member.designation}
        </span>
        <h4
          className={cn(
            'font-display font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]',
            large ? 'text-[clamp(28px,3vw,42px)]' : 'text-[24px]'
          )}
        >
          {member.name}
        </h4>
        {member.background && (
          <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">{member.background}</p>
        )}
        {linkedin && (
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-mist/[0.14] px-3.5 py-1.5 text-[13px] text-[var(--fg)] transition hover:border-gold/60 hover:text-gold"
          >
            <Linkedin className="h-4 w-4" aria-hidden />
            LinkedIn<span className="sr-only"> profile of {member.name}</span>
          </a>
        )}
      </div>
    </FxCard>
  );
}

interface OrgNode {
  role: string;
  holder?: string;
  photo?: string;
  note?: string;
}

/**
 * Organisation tree following the documented chart: President → Vice President → Secretary &
 * Treasurer → Executive Council → Wing Conveners → Wing Committee → Young Professional
 * Coordinators → Members. Connectors draw in on scroll and carry a travelling pulse.
 */
function OrgTree({ nodes }: { nodes: OrgNode[] }) {
  const by = (role: string) => nodes.find((n) => n.role === role);
  const president = by('President');
  const vp = by('Vice President');
  const officers = [by('Secretary'), by('Treasurer')].filter((n): n is OrgNode => !!n);
  const council = by('Executive Council');
  const bands = ['Wing Conveners', 'Wing Committee', 'Young Professional Coordinators', 'Members']
    .map(by)
    .filter((n): n is OrgNode => !!n);
  const councilMembers = council?.note?.split(/,\s*|\s*&\s*/).filter(Boolean) ?? [];
  const bandIcons: LucideIcon[] = [Landmark, Users, GraduationCap, Network];

  let step = 0;
  const d = () => ({ ['--d' as string]: `${step++ * 140}ms` });

  return (
    <InView className="mx-auto mt-14 flex max-w-[900px] flex-col items-center">
      <ol
        className="flex w-full flex-col items-center"
        aria-label="Organisation structure, top to bottom"
      >
        {president && (
          <li className="tree-node w-full max-w-[420px]" style={d()}>
            <LeaderNode node={president} primary />
          </li>
        )}
        <li aria-hidden className="tree-line h-10" style={d()} />
        {vp && (
          <li className="tree-node w-full max-w-[420px]" style={d()}>
            <LeaderNode node={vp} />
          </li>
        )}

        {officers.length > 0 && (
          <>
            <li aria-hidden className="tree-line h-8" style={d()} />
            <li aria-hidden className="tree-hline w-[min(70%,520px)]" style={d()} />
            <li className="grid w-full max-w-[640px] grid-cols-2 gap-3 sm:gap-6">
              {officers.map((o) => (
                <div key={o.role} className="flex flex-col items-center">
                  <span aria-hidden className="tree-line h-6" style={d()} />
                  <div className="tree-node w-full" style={d()}>
                    <LeaderNode node={o} compact />
                  </div>
                </div>
              ))}
            </li>
          </>
        )}

        {council && (
          <>
            <li aria-hidden className="tree-line h-10" style={d()} />
            <li className="tree-node w-full" style={d()}>
              <FxCard
                max={3}
                className="overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-brand-900 via-brand-950 to-bg p-6 text-center md:p-8"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-gold/20 blur-[70px]"
                />
                <span className="relative mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-grad-gold text-brand-950">
                  <Landmark className="h-6 w-6" aria-hidden />
                </span>
                <p className="relative mt-4 font-display text-[clamp(26px,3vw,38px)] font-medium tracking-[-0.035em] text-[var(--fg)]">
                  {council.role}
                </p>
                {councilMembers.length > 0 && (
                  <ul className="relative mt-5 flex flex-wrap justify-center gap-2">
                    {councilMembers.map((m) => (
                      <li
                        key={m}
                        className="rounded-full border border-mist/[0.14] bg-bg/50 px-3.5 py-1.5 text-[13px] text-[var(--fg)] backdrop-blur"
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </FxCard>
            </li>
          </>
        )}

        {bands.map((b, i) => {
          const Icon = bandIcons[i] ?? Users;
          const last = i === bands.length - 1;
          return (
            <React.Fragment key={b.role}>
              <li aria-hidden className="tree-line h-10" style={d()} />
              <li className="tree-node" style={{ ...d(), width: `min(100%, ${560 + i * 110}px)` }}>
                <FxCard
                  max={3}
                  className={cn(
                    'flex items-center gap-4 overflow-hidden rounded-[24px] border px-5 py-4 text-left md:px-6',
                    last
                      ? 'border-transparent bg-grad-primary'
                      : 'border-mist/[0.12] bg-bg/70 backdrop-blur'
                  )}
                >
                  <span
                    className={cn(
                      'fx-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl',
                      last ? 'bg-white/15 text-white' : 'bg-brand-500/15 text-brand-200'
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block font-display text-[clamp(18px,2vw,23px)] font-medium tracking-[-0.03em]',
                        last ? 'text-white' : 'text-[var(--fg)]'
                      )}
                    >
                      {b.role}
                    </span>
                    {b.holder ? (
                      <span className="block text-[13.5px] text-gold">{b.holder}</span>
                    ) : (
                      b.note && (
                        <span
                          className={cn(
                            'block text-[13px]',
                            last ? 'text-white/80' : 'text-[var(--muted)]'
                          )}
                        >
                          {b.note}
                        </span>
                      )
                    )}
                  </span>
                </FxCard>
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </InView>
  );
}

function LeaderNode({
  node,
  primary,
  compact,
}: {
  node: OrgNode;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <FxCard
      max={6}
      className={cn(
        'flex flex-col items-center overflow-hidden rounded-[28px] border text-center',
        compact ? 'gap-2 p-4 sm:p-5' : 'gap-3 p-6 md:p-7',
        primary
          ? 'border-gold/45 bg-gradient-to-b from-gold/[0.14] to-transparent'
          : 'border-mist/[0.14] bg-bg/70 backdrop-blur'
      )}
    >
      {primary && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gold/30 blur-[60px]"
        />
      )}
      {node.holder ? (
        <span className={cn('relative rounded-full', primary && 'ring-spin')}>
          <Avatar
            name={node.holder}
            src={node.photo}
            size={compact ? 52 : primary ? 84 : 68}
            className="border-4 border-bg"
          />
        </span>
      ) : (
        <span
          className={cn(
            'relative grid place-items-center rounded-full border border-dashed border-mist/[0.25] text-[var(--muted)]',
            compact ? 'h-[52px] w-[52px]' : 'h-[68px] w-[68px]'
          )}
          aria-hidden
        >
          ?
        </span>
      )}
      <span className="relative font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold sm:text-[11px]">
        {node.role}
      </span>
      {node.holder ? (
        <span
          className={cn(
            'relative font-display font-medium tracking-[-0.03em] text-[var(--fg)]',
            compact ? 'text-[17px] sm:text-[20px]' : 'text-[24px] md:text-[28px]'
          )}
        >
          {node.holder}
        </span>
      ) : (
        <span
          className={cn(
            'relative font-serif italic text-[var(--muted)]',
            compact ? 'text-[16px] sm:text-[19px]' : 'text-[22px]'
          )}
        >
          To be announced
        </span>
      )}
    </FxCard>
  );
}
