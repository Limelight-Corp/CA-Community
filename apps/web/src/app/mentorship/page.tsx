import type { Metadata } from 'next';
import Link from 'next/link';
import { HeartHandshake, MessageCircleQuestion, Sparkles, UserRoundCheck } from 'lucide-react';
import { ORG_COMMUNITIES, ORG_WINGS, wingSlug } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { CtaBand, PageHero, Section } from '../../components/content/ui';
import { approvedMentors } from '../../lib/mentorship';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Mentorship',
  description: 'Mentor Match, MentorHer and Teach & Mentor — find a mentor or become one in the community.',
  alternates: { canonical: '/mentorship' },
};

/** Mentoring formats named in the wings' proposed activities (Blueprint slide 6). */
const FORMATS = ORG_WINGS.flatMap((w) => w.activities.filter((a) => /mentor/i.test(a)).map((a) => ({ activity: a, wing: w })));

export default function MentorshipPage() {
  const mentors = approvedMentors();
  const communities = ORG_COMMUNITIES.filter((c) => c.points.some((p) => /mentor/i.test(p)));

  const steps = [
    { icon: MessageCircleQuestion, title: 'Tell us what you need', text: 'Members share their stage and goals from the dashboard — or apply to mentor with their expertise.' },
    { icon: HeartHandshake, title: 'We match you', text: 'Our team pairs mentees with a mentor who has the right experience and time.' },
    { icon: UserRoundCheck, title: 'Meet and grow', text: 'Both of you get an email introduction with each other’s contact details.' },
  ];

  return (
    <>
      <PageHero
        eyebrow="Mentorship"
        eyebrowTone="gold"
        title="Learn from those"
        accent="a few steps ahead."
        lead="Mentorship is a member benefit: find a mentor for your career, practice or next move — or give back by mentoring students and young CAs."
        ghost="MENTOR"
      >
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/dashboard?tab=mentorship" className="inline-flex h-12 items-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white">
            Find a mentor
          </Link>
          <Link href="/dashboard?tab=mentorship" className="inline-flex h-12 items-center gap-2 rounded-full border border-mist/[0.2] px-6 text-[15px] font-semibold text-[var(--fg)]">
            Become a mentor
          </Link>
        </div>
      </PageHero>

      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          <ol className="grid gap-5 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-[26px] border border-mist/[0.1] bg-grad-surface p-6">
                <span className="font-mono text-[12px] text-gold">0{i + 1}</span>
                <Icon className="mt-3 h-7 w-7 text-gold" aria-hidden />
                <h2 className="mt-4 font-display text-[21px] font-medium tracking-[-0.02em] text-[var(--fg)]">{title}</h2>
                <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.03em] text-[var(--fg)]">Formats across the wings</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {FORMATS.map(({ activity, wing }) => (
                  <li key={`${wing.number}-${activity}`} className="flex items-center justify-between gap-3 rounded-2xl border border-mist/[0.1] px-5 py-4">
                    <span className="font-medium text-[var(--fg)]">{activity}</span>
                    <Link href={`/wings/${wingSlug(wing.name)}`} className="text-[13px] text-[var(--muted)] hover:text-gold">
                      {wing.name} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-display text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.03em] text-[var(--fg)]">Who mentors and who’s supported</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {communities.map((c) => (
                  <li key={c.name} className="rounded-2xl border border-mist/[0.1] px-5 py-4">
                    <p className="font-medium text-[var(--fg)]">{c.name}</p>
                    <p className="mt-1 text-[13.5px] text-[var(--muted)]">{c.points.join(' · ')}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 flex items-center gap-2 text-[14px] text-[var(--fg-soft)]">
                <Sparkles className="h-4 w-4 text-gold" aria-hidden />
                {mentors.length > 0
                  ? `${mentors.length} member${mentors.length === 1 ? ' is' : 's are'} mentoring right now — members can see them in the dashboard.`
                  : 'Mentor profiles open to members in the dashboard as soon as the first mentors are approved.'}
              </p>
            </div>
          </div>
        </Container>
      </Section>
      <CtaBand
        title="Not a member"
        accent="yet?"
        lead="Mentorship opportunities are part of every membership plan — including the Student plan."
        primary={{ href: '/join', label: 'See membership plans' }}
      />
    </>
  );
}
