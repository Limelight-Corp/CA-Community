import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Container, Kicker, cn } from '@ascend/ui';
import { getSettings } from '../../../lib/community-store';
import { LEGAL_DOCS, getLegalDoc } from '../../../components/content/legal-docs';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return { title: 'Not found' };
  const { siteName } = getSettings();
  return {
    title: doc.title,
    description: `${doc.summary} (${siteName})`,
    alternates: { canonical: `/legal/${doc.slug}` },
  };
}

export default async function LegalDocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();
  const { siteName } = getSettings();

  return (
    <>
      <section className="grain relative overflow-hidden border-b border-[var(--line)] pb-14 pt-14 md:pb-20 md:pt-20">
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <Container size="wide" className="relative z-10 flex flex-col gap-6">
          <Kicker>Legal · {siteName}</Kicker>
          <h1 className="max-w-[16ch] font-display text-[clamp(42px,7vw,100px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">{doc.title}</h1>
          <p className="max-w-[60ch] text-[clamp(16px,1.4vw,19px)] leading-relaxed text-[var(--muted)]">{doc.summary}</p>
        </Container>
      </section>

      <Container size="wide" className="grid gap-12 py-14 md:py-20 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Legal documents" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {LEGAL_DOCS.map((d) => {
              const active = d.slug === doc.slug;
              return (
                <li key={d.slug} className="shrink-0">
                  <Link
                    href={`/legal/${d.slug}`}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'block rounded-full px-4 py-2.5 text-[14px] transition lg:rounded-2xl',
                      active ? 'bg-gold/10 text-gold-soft ring-1 ring-gold/40' : 'text-[var(--muted)] hover:bg-mist/[0.06] hover:text-[var(--fg)]'
                    )}
                  >
                    {d.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex max-w-[760px] flex-col gap-10">
          <div role="note" className="flex gap-3 rounded-[20px] border border-warn/40 bg-warn/10 p-5 text-[14.5px] leading-relaxed text-[var(--fg)]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warn" aria-hidden />
            <p>
              <strong className="font-semibold">Draft</strong> — the exact legal wording is to be reviewed by the organisation’s legal/professional advisor.
            </p>
          </div>

          <ol className="flex flex-col gap-10">
            {doc.sections.map((s, i) => (
              <li key={s.heading} className="flex flex-col gap-3">
                <h2 className="flex items-baseline gap-3 font-display text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
                  <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, '0')}</span>
                  {s.heading}
                </h2>
                {s.body.map((p, j) => (
                  <p key={j} className="text-[16px] leading-[1.75] text-[var(--muted)]">
                    {p}
                  </p>
                ))}
              </li>
            ))}
          </ol>

          <Link
            href="/contact"
            className="group inline-flex w-fit items-center gap-3 rounded-full border border-mist/[0.16] py-2 pl-5 pr-2 text-[14.5px] font-semibold text-[var(--fg)] hover:border-gold/50"
          >
            Questions? Contact us
            <span className="grid h-9 w-9 place-items-center rounded-full bg-mist/[0.08] transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>
        </div>
      </Container>
    </>
  );
}
