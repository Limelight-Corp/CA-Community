import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Container, Kicker } from '@ascend/ui';
import { legalDocs } from '../../lib/legal';

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Privacy policy, terms & conditions, event registration terms, cancellation & refund policy, payment terms and cookie policy.',
  alternates: { canonical: '/legal' },
};

export default async function LegalIndexPage() {
  const docs = await legalDocs();
  return (
    <section className="py-10 sm:py-16 md:py-24">
      <Container size="wide" className="w-full min-w-0 max-w-full flex flex-col gap-8 sm:gap-12">
        <div className="flex flex-col gap-4 sm:gap-6">
          <Kicker>Legal & Compliance</Kicker>
          <h1 className="font-display text-[clamp(34px,6.5vw,96px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
            The fine print.
          </h1>
          <p className="max-w-[62ch] text-[15px] sm:text-[16.5px] leading-relaxed text-[var(--muted)]">
            Official terms, member guidelines, event policies and governance standards designed to protect our members and ensure transparent community operations.
          </p>
          {docs.some((d) => !d.edited) && (
            <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-2.5 text-[13px] sm:text-[14px] leading-relaxed text-[var(--fg)] max-w-2xl">
              <strong>Note:</strong> Draft policies — the exact legal wording is subject to periodic review by the organisation’s legal and professional advisors.
            </p>
          )}
        </div>

        <ul className="border-t border-[var(--line)]">
          {docs.map((d, i) => (
            <li key={d.slug}>
              <Link
                href={`/legal/${d.slug}`}
                className="group flex flex-col gap-2.5 border-b border-[var(--line)] py-5 transition-colors sm:grid sm:grid-cols-[3rem_1.3fr_1.6fr_auto] sm:items-center sm:gap-6 sm:py-6 hover:bg-gold/[0.02]"
              >
                <span className="font-mono text-[12px] font-semibold text-gold">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center justify-between sm:block">
                  <span className="font-display text-[20px] font-medium tracking-[-0.03em] text-[var(--fg)] transition-transform duration-300 group-hover:translate-x-1 sm:text-[22px] md:text-[28px]">
                    {d.title}
                  </span>
                  <ArrowUpRight
                    className="h-5 w-5 shrink-0 text-gold transition-transform duration-300 group-hover:rotate-45 sm:hidden"
                    aria-hidden
                  />
                </div>
                <span className="text-[13.5px] leading-relaxed text-[var(--muted)] sm:text-[14.5px]">
                  {d.summary}
                </span>
                <ArrowUpRight
                  className="hidden h-5 w-5 shrink-0 text-[var(--muted)] transition-transform duration-300 group-hover:rotate-45 group-hover:text-gold sm:block"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
