import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { Container } from '@ascend/ui';
import { PageHero, Section } from '../../components/content/ui';
import { DirectoryBrowser } from '../../components/directory/DirectoryBrowser';
import { directoryEntries } from '../../lib/directory';
import { isApprovedMember, membershipFor } from '../../lib/member-accounts';
import { currentMember } from '../../lib/member-session';
import { siteWings } from '../../lib/taxonomy';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Member directory',
  description: 'Find and connect with fellow members across cities, firms and wings.',
  robots: { index: false },
};

export default async function DirectoryPage() {
  const account = await currentMember();
  const member = isApprovedMember(account);
  const application = account ? membershipFor(account) : undefined;
  const entries = member ? directoryEntries() : [];
  const listedCount = member ? entries.length : directoryEntries().length;

  return (
    <>
      <PageHero
        eyebrow="Members only"
        eyebrowTone="blue"
        title="Member"
        accent="directory."
        lead="Find fellow members by city, firm, expertise or wing — and connect on LinkedIn. Only members who choose to be listed appear here."
        ghost="NETWORK"
      />
      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          {member ? (
            <DirectoryBrowser
              entries={entries}
              wings={siteWings().map((w) => ({ number: w.number, name: w.name }))}
              selfListed={!!account?.profile.directoryOptIn}
            />
          ) : (
            <div className="mx-auto flex max-w-[640px] flex-col items-start gap-5 rounded-[28px] border border-gold/25 bg-gold/[0.05] p-7 sm:p-9">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold">
                <Lock className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="font-display text-[clamp(24px,3vw,32px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
                The directory is a member benefit.
              </h2>
              <p className="text-[15px] leading-relaxed text-[var(--muted)]">
                {listedCount > 0
                  ? `${listedCount} member${listedCount === 1 ? ' has' : 's have'} listed their profile so far. `
                  : ''}
                {!account
                  ? 'Log in with your member account to browse it.'
                  : application?.status === 'pending'
                    ? 'Your membership application is being reviewed — the directory opens as soon as it is approved.'
                    : !account.emailVerifiedAt
                      ? 'Confirm your email and become a member to browse it.'
                      : 'Become a member to browse it and list your own profile.'}
              </p>
              <div className="flex flex-wrap gap-3">
                {!account ? (
                  <Link href="/login?next=/directory" className="inline-flex h-11 items-center rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white">
                    Log in
                  </Link>
                ) : null}
                {!application && (
                  <Link href="/join" className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950">
                    <Sparkles className="h-4 w-4" aria-hidden /> See membership plans
                  </Link>
                )}
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
