import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Container, Kicker } from '@ascend/ui';
import { LEGAL_DOCS } from '../../components/content/legal-docs';

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Privacy policy, terms & conditions, event registration terms, cancellation & refund policy, payment terms and cookie policy.',
  alternates: { canonical: '/legal' },
};

export default function LegalIndexPage() {
  return (
    <section className="py-16 md:py-24">
      <Container size="wide" className="flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <Kicker>Legal</Kicker>
          <h1 className="font-display text-[clamp(44px,8vw,112px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">The fine print.</h1>
          <p className="max-w-[56ch] text-[17px] text-[var(--muted)]">Draft policies — the exact legal wording is to be reviewed by the organisation’s legal/professional advisor.</p>
        </div>
        <ul className="border-t border-[var(--line)]">
          {LEGAL_DOCS.map((d, i) => (
            <li key={d.slug}>
              <Link href={`/legal/${d.slug}`} className="group grid gap-2 border-b border-[var(--line)] py-6 md:grid-cols-[4rem_1fr_1.4fr_auto] md:items-center md:gap-8">
                <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-[clamp(24px,3vw,36px)] font-medium tracking-[-0.035em] text-[var(--fg)] transition-transform duration-300 group-hover:translate-x-2">{d.title}</span>
                <span className="text-[14.5px] text-[var(--muted)]">{d.summary}</span>
                <ArrowUpRight className="hidden h-6 w-6 text-[var(--muted)] transition-transform duration-300 group-hover:rotate-45 group-hover:text-gold md:block" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
