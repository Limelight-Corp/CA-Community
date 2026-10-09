import React from 'react';
import type { Metadata } from 'next';
import { Linkedin, Sparkles } from 'lucide-react';
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
  type CommunityTeamMember,
  type CommunityWing,
} from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker, SectionHeading, cn } from '@ascend/ui';
import { Marquee, Reveal } from '../../components/ui-client';
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

const TEAM_GROUPS: CommunityTeamMember['group'][] = ['Leadership', 'Core Team', 'Wing Conveners', 'Advisory Board'];
const GROUP_LEAD: Record<CommunityTeamMember['group'], string> = {
  Leadership: 'The office bearers steering the community.',
  'Core Team': 'The people running programmes, cities and operations.',
  'Wing Conveners': 'One convener leads each professional wing.',
  'Advisory Board': 'Senior professionals guiding the community’s direction.',
};

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

  const groups = TEAM_GROUPS.map((g) => ({ group: g, members: team.filter((m) => m.group === g) })).filter((g) => g.members.length > 0);

  // Named holders come from the documents first, then from published team profiles with the same designation.
  const holderFor = (role: string, docHolder?: string) =>
    docHolder || team.find((m) => m.designation.trim().toLowerCase() === role.toLowerCase())?.name;

  const youngWing = ORG_WINGS.find((w) => w.number === 6);
  const sameAs = Object.values(settings.social).map((u) => safeUrl(u)).filter((u): u is string => !!u && /^https?:/.test(u));

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    url: siteUrl(),
    logo: `${siteUrl()}/icon.svg`,
    description: `${ORG_POSITIONING.title} ${ORG_POSITIONING.titleAccent}. ${ORG_POSITIONING.idea}`,
    ...(sameAs.length ? { sameAs } : {}),
  };

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
          <PillLink href="#wings" variant="ghost">
            Explore the 10 wings
          </PillLink>
        </div>
      </PageHero>

      {/* ---------------------------------------------------------------- Pillars marquee */}
      <div className="border-b border-[var(--line)] py-6">
        <Marquee duration={36} gap="2.5rem" ariaLabel="Our six pillars">
          {ORG_CORE_PURPOSES.map((p, i) => (
            <span key={p.key} className="flex items-center gap-10 font-display text-[clamp(40px,6vw,88px)] font-medium leading-none tracking-[-0.05em]">
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
          <div className="mt-14 grid gap-5 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <article className="grain relative h-full overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface p-8 md:p-12">
                <div className="aurora opacity-60" aria-hidden>
                  <i />
                </div>
                <div className="relative z-10 flex h-full flex-col gap-8">
                  <Kicker>Our vision</Kicker>
                  <p className="text-balance font-display text-[clamp(26px,3.2vw,44px)] font-medium leading-[1.08] tracking-[-0.035em] text-[var(--fg)]">
                    {ORG_VISION}
                  </p>
                </div>
              </article>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-5">
              <article className="flex h-full flex-col gap-8 rounded-[28px] border border-gold/25 bg-gold/[0.06] p-8 md:p-12">
                <Kicker tone="gold">Our mission</Kicker>
                <blockquote className="font-serif text-[clamp(24px,2.4vw,34px)] italic leading-[1.2] text-[var(--fg)]">
                  “{ORG_MISSION}”
                </blockquote>
              </article>
            </Reveal>
            <Reveal delay={200} className="lg:col-span-12">
              <div className="flex flex-col gap-6 rounded-[28px] border border-mist/[0.1] p-8 md:flex-row md:items-center md:justify-between md:p-10">
                <p className="max-w-[70ch] text-[17px] leading-relaxed text-[var(--muted)]">
                  <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Vision statement</span>
                  {ORG_VISION_STATEMENT}
                </p>
                <p className="shrink-0 font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">
                  {ORG_TAGLINE.split('.')[0]}. <AccentText tone="gold">{ORG_TAGLINE.split('.').slice(1).join('.').trim()}</AccentText>
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Built for young CAs */}
      <Section className="border-y border-[var(--line)] bg-grad-surface" labelledBy="young-heading">
        <Container size="wide" className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <Kicker tone="gold">Why it was created</Kicker>
            <h2 id="young-heading" className="font-display text-[clamp(38px,6vw,88px)] font-medium leading-[0.92] tracking-[-0.05em] text-[var(--fg)]">
              Built for the <AccentText tone="hero">next generation</AccentText> of the profession.
            </h2>
            <p className="max-w-[56ch] text-[17px] leading-relaxed text-[var(--muted)]">
              {ORG_POSITIONING.summary} — with opportunities all year round, not once a year. Young CAs and students
              aren’t an afterthought here: they have their own wing, their own city leads, dedicated young professional
              coordinators and a student membership.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { k: `Wing ${String(youngWing?.number ?? 6).padStart(2, '0')}`, v: youngWing?.name ?? 'Young Professionals & Career', d: youngWing?.focus.join(' · ') },
              { k: 'Community', v: 'Young CA Leads', d: 'City-wise young CA representatives, mentorship & leadership initiatives' },
              { k: 'Structure', v: 'Young Professional Coordinators', d: 'Built into the core executive structure' },
              { k: 'Membership', v: 'Student Member plan', d: 'Mentorship, career guidance and selected free webinars' },
            ].map((item, i) => (
              <Reveal as="li" key={item.v} delay={i * 80} className="rounded-[24px] border border-mist/[0.1] bg-bg/60 p-6 backdrop-blur">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">{item.k}</span>
                <p className="mt-3 font-display text-[22px] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)]">{item.v}</p>
                {item.d && <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--muted)]">{item.d}</p>}
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Objectives */}
      <Section labelledBy="objectives-heading">
        <Container size="wide">
          <div className="flex flex-col gap-5">
            <Kicker>Objectives</Kicker>
            <h2 id="objectives-heading" className="max-w-[16ch] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--fg)]">
              Six things we <AccentText>show up for.</AccentText>
            </h2>
          </div>
          <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ORG_CORE_PURPOSES.map((p, i) => (
              <Reveal
                as="li"
                key={p.key}
                delay={(i % 3) * 90}
                className={cn(
                  'shine group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] border p-7 transition-transform duration-500 hover:-translate-y-1.5',
                  i === 0 || i === 4 ? 'border-gold/25 bg-gold/[0.06]' : 'border-mist/[0.1] bg-grad-surface'
                )}
              >
                <span className="font-mono text-[12px] tracking-[0.14em] text-[var(--muted)]">{String(i + 1).padStart(2, '0')} / 06</span>
                <div>
                  <h3 className="font-display text-[clamp(40px,4.4vw,64px)] font-medium leading-none tracking-[-0.05em] text-[var(--fg)]">
                    {p.title}
                    <span className="text-gold">.</span>
                  </h3>
                  <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-[var(--muted)]">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>

          <div className="mt-20 grid gap-10 lg:grid-cols-[0.8fr_2fr]">
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-[32px] font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]">Focus areas</h3>
              <p className="text-[15px] leading-relaxed text-[var(--muted)]">Five areas that shape every programme, wing and city chapter.</p>
            </div>
            <ul className="border-t border-[var(--line)]">
              {ORG_FOCUS_AREAS.map((f, i) => (
                <li key={f.title} className="group grid gap-2 border-b border-[var(--line)] py-6 sm:grid-cols-[3rem_1fr_1.2fr] sm:items-baseline sm:gap-6">
                  <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)] transition-transform duration-500 group-hover:translate-x-2">
                    {f.title}
                  </span>
                  <span className="text-[14.5px] leading-relaxed text-[var(--muted)]">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Guiding principles */}
      <Section className="overflow-hidden border-y border-[var(--line)]" labelledBy="principles-heading">
        <Container size="wide">
          <Kicker tone="gold">Guiding principles</Kicker>
          <h2 id="principles-heading" className="sr-only">
            Guiding principles
          </h2>
          <ul className="mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-3">
            {ORG_GUIDING_PRINCIPLES.map((p, i) => (
              <li
                key={p}
                className={cn(
                  'font-display text-[clamp(34px,5.6vw,80px)] font-medium leading-[1] tracking-[-0.05em] transition-colors duration-300',
                  i % 2 ? 'text-outline hover:text-[var(--fg)]' : 'text-[var(--fg)] hover:text-gold'
                )}
              >
                {p}
                <span className="text-gold" aria-hidden>
                  {i < ORG_GUIDING_PRINCIPLES.length - 1 ? ' /' : '.'}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Leadership */}
      <Section id="leadership" labelledBy="leadership-heading">
        <Container size="wide">
          <div className="flex flex-col gap-5">
            <Kicker>Leadership & team</Kicker>
            <h2 id="leadership-heading" className="max-w-[18ch] font-display text-[clamp(40px,6vw,84px)] font-medium leading-[0.96] tracking-[-0.045em] text-[var(--fg)]">
              The people <AccentText tone="gold">behind it.</AccentText>
            </h2>
          </div>

          {groups.length === 0 ? (
            <p className="mt-10 text-[var(--muted)]">Team profiles will be published soon.</p>
          ) : (
            <div className="mt-14 flex flex-col gap-16">
              {groups.map(({ group, members }) => (
                <div key={group} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1 border-b border-[var(--line)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="font-display text-[26px] font-medium tracking-[-0.03em] text-[var(--fg)]">{group}</h3>
                    <p className="text-[14px] text-[var(--muted)]">{GROUP_LEAD[group]}</p>
                  </div>
                  <ul className={cn('grid gap-5', group === 'Leadership' ? 'md:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3')}>
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

      {/* ---------------------------------------------------------------- Organisation structure */}
      <Section id="structure" className="border-y border-[var(--line)] bg-grad-surface">
        <Container size="wide">
          <SectionHeading
            eyebrow="Organisation structure"
            title="How the community"
            accent="is organised."
            lead="Core leadership and executive structure, from the office bearers to every member of the forum."
          />
          <OrgChart
            nodes={ORG_STRUCTURE.map((n) => ({
              role: n.role,
              holder: holderFor(n.role, 'holder' in n ? n.holder : undefined),
              note: 'note' in n ? n.note : undefined,
            }))}
          />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Wings */}
      <Section id="wings" labelledBy="wings-heading">
        <Container size="wide">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5">
              <Kicker tone="gold">10 professional wings</Kicker>
              <h2 id="wings-heading" className="max-w-[14ch] font-display text-[clamp(44px,7.5vw,112px)] font-medium leading-[0.9] tracking-[-0.055em] text-[var(--fg)]">
                Ten wings. <AccentText tone="hero">One community.</AccentText>
              </h2>
            </div>
            <p className="max-w-[44ch] text-[16px] leading-relaxed text-[var(--muted)]">
              Each wing is led by a convener and a wing committee, running year-round formats that build up to an annual summit. Tap a wing to see its focus areas and proposed activities.
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
          <ul className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ORG_COMMUNITIES.map((c, i) => (
              <Reveal
                as="li"
                key={c.name}
                delay={(i % 3) * 90}
                className={cn(
                  'flex flex-col gap-5 rounded-[28px] border p-7',
                  i === 2 || i === 3 ? 'border-gold/25 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'
                )}
              >
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 font-display text-[28px] font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]">{c.name}</h3>
                  <p className="mt-1 text-[13.5px] text-brand-200">{c.subtitle}</p>
                </div>
                <ul className="mt-auto flex flex-col gap-2 border-t border-[var(--line)] pt-4">
                  {c.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-[14px] text-[var(--muted)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
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
    <article
      className={cn(
        'shine group relative flex h-full gap-5 overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface p-6 transition-transform duration-500 hover:-translate-y-1',
        large ? 'flex-col sm:flex-row sm:items-center md:p-8' : 'flex-col'
      )}
    >
      <Avatar name={member.name} src={photo} size={large ? 132 : 88} rounded="xl" className="ring-1 ring-gold/30" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">{member.designation}</span>
        <h4 className={cn('font-display font-medium leading-tight tracking-[-0.035em] text-[var(--fg)]', large ? 'text-[clamp(28px,3vw,40px)]' : 'text-[24px]')}>
          {member.name}
        </h4>
        {member.background && <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">{member.background}</p>}
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
    </article>
  );
}

interface OrgNode {
  role: string;
  holder?: string;
  note?: string;
}

/** Tiered organisation chart: office bearers in pairs, then widening bands down to members. */
function OrgChart({ nodes }: { nodes: OrgNode[] }) {
  const pairs = [nodes.slice(0, 2), nodes.slice(2, 4)];
  const bands = nodes.slice(4);
  return (
    <div className="mt-14 flex flex-col items-center gap-0" role="list" aria-label="Organisation structure, top to bottom">
      {pairs.map((pair, tier) => (
        <React.Fragment key={tier}>
          <div className="grid w-full max-w-[760px] gap-4 sm:grid-cols-2" role="presentation">
            {pair.map((n) => (
              <div
                key={n.role}
                role="listitem"
                className={cn(
                  'relative flex flex-col gap-2 rounded-[24px] border p-6 text-center',
                  tier === 0 ? 'border-gold/40 bg-gold/[0.08]' : 'border-mist/[0.14] bg-bg/60'
                )}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{n.role}</span>
                {n.holder ? (
                  <span className="font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">{n.holder}</span>
                ) : (
                  <span className="font-serif text-[22px] italic text-[var(--muted)]">To be announced</span>
                )}
              </div>
            ))}
          </div>
          <Connector />
        </React.Fragment>
      ))}
      {bands.map((n, i) => (
        <React.Fragment key={n.role}>
          <div
            role="listitem"
            className={cn(
              'flex flex-col items-center gap-1 rounded-[24px] border px-6 py-5 text-center sm:flex-row sm:justify-between sm:gap-6 sm:text-left',
              i === bands.length - 1 ? 'border-brand-500/40 bg-brand-500/15' : 'border-mist/[0.12] bg-bg/60'
            )}
            style={{ width: `min(100%, ${760 + i * 90}px)` }}
          >
            <span className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">{n.role}</span>
            {n.holder ? (
              <span className="text-[14px] text-gold">{n.holder}</span>
            ) : (
              n.note && <span className="text-[13.5px] text-[var(--muted)]">{n.note}</span>
            )}
          </div>
          {i < bands.length - 1 && <Connector />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Connector() {
  return <span aria-hidden className="h-8 w-px bg-gradient-to-b from-gold/70 to-mist/10" />;
}
