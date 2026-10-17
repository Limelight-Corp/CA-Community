import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Container, Kicker, cn } from '@ascend/ui';
import { getSettings } from '../../../lib/community-store';
import { LEGAL_DOCS } from '@ascend/shared';
import { legalDoc, legalDocs } from '../../../lib/legal';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await legalDoc(slug);
  if (!doc) return { title: 'Not found' };
  const { siteName } = await getSettings();
  return {
    title: doc.title,
    description: `${doc.summary} (${siteName})`,
    alternates: { canonical: `/legal/${doc.slug}` },
  };
}

export default async function LegalDocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = await legalDoc(slug);
  if (!doc) notFound();
  const docs = await legalDocs();
  const { siteName } = await getSettings();

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-[var(--line)] pb-10 pt-10 sm:pb-16 sm:pt-16 md:pb-20 md:pt-20">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <Container size="wide" className="relative z-10 flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-wrap items-center gap-2 text-[12px] font-mono text-gold">
            <Link
              href="/legal"
              className="inline-flex items-center gap-1 text-[var(--muted)] transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Policies
            </Link>
            <span className="text-mist/[0.3]">•</span>
            <Kicker tone="gold">Legal · {siteName}</Kicker>
          </div>
          <h1 className="max-w-[18ch] font-display text-[clamp(28px,5.5vw,84px)] font-medium leading-[1.02] tracking-[-0.04em] text-[var(--fg)]">
            {doc.title}
          </h1>
          <p className="max-w-[64ch] text-[clamp(14.5px,1.25vw,18px)] leading-relaxed text-[var(--muted)]">
            {doc.summary}
          </p>
        </Container>
      </section>

      <Container size="wide" className="w-full min-w-0 max-w-full grid gap-8 py-10 sm:gap-10 sm:py-14 md:py-20 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sticky Sidebar on Desktop / Scrollable Pills on Mobile & Tablet */}
        <nav aria-label="Legal documents" className="w-full min-w-0 max-w-full overflow-hidden lg:overflow-visible lg:sticky lg:top-28 lg:self-start">
          <div className="w-full min-w-0 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar touch-pan-x">
            <ul className="flex w-max min-w-full gap-2 lg:w-auto lg:flex-col lg:gap-1.5">
              {docs.map((d) => {
                const active = d.slug === doc.slug;
                return (
                  <li key={d.slug} className="shrink-0">
                    <Link
                      href={`/legal/${d.slug}`}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block whitespace-nowrap rounded-full px-4 py-2 text-[13px] transition sm:text-[14px] lg:whitespace-normal lg:rounded-2xl lg:px-4 lg:py-2.5',
                        active
                          ? 'bg-grad-gold text-[#2A1A0E] font-semibold shadow-sm ring-1 ring-gold/40'
                          : 'border border-mist/[0.12] bg-bg/60 text-[var(--muted)] hover:border-gold/30 hover:bg-mist/[0.06] hover:text-[var(--fg)] lg:border-transparent lg:bg-transparent'
                      )}
                    >
                      {d.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="w-full min-w-0 max-w-[760px] flex flex-col gap-8 sm:gap-10">
          {doc.edited ? (
            doc.updatedAt && (
              <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-[var(--muted)] sm:text-[12px]">
                Last updated {doc.updatedAt.slice(0, 10)}
              </p>
            )
          ) : (
            <div
              role="note"
              className="w-full min-w-0 flex gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4 text-[13.5px] leading-relaxed text-[var(--fg)] sm:p-5 sm:text-[14.5px]"
            >
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
              <p className="min-w-0 flex-1 break-words">
                <strong className="font-semibold">Draft</strong> — the exact legal wording is subject to formal review by the organisation’s legal and professional advisors.
              </p>
            </div>
          )}

          <ol className="w-full min-w-0 flex flex-col gap-8 sm:gap-10">
            {doc.sections.map((s, i) => (
              <li key={`${i}-${s.heading}`} className="w-full min-w-0 flex flex-col gap-3">
                <h2 className="w-full min-w-0 flex items-start gap-2.5 sm:gap-3.5 font-display text-[clamp(19px,2.2vw,28px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
                  <span className="font-mono text-[12px] sm:text-[13px] font-semibold text-gold shrink-0 pt-0.5 sm:pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 break-words">{s.heading}</span>
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} className="w-full min-w-0 text-[14.5px] sm:text-[15.5px] md:text-[16px] leading-[1.75] text-[var(--muted)] break-words">
                    {p}
                  </p>
                ))}
              </li>
            ))}
          </ol>

          <div className="w-full min-w-0 flex flex-col gap-4 border-t border-mist/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/contact"
              className="group inline-flex w-full items-center justify-between gap-3 rounded-full border border-mist/[0.16] py-2 pl-5 pr-2 text-[14px] font-semibold text-[var(--fg)] hover:border-gold/50 sm:w-fit sm:justify-start"
            >
              Questions? Contact us
              <span className="grid h-9 w-9 place-items-center rounded-full bg-mist/[0.08] transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>

            <Link
              href="/legal"
              className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--muted)] transition-colors hover:text-gold"
            >
              <ArrowLeft className="h-4 w-4" /> View all policies
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
