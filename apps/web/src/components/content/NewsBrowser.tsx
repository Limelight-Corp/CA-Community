'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import { EmptyState, cn } from '@ascend/ui';
import { chipClass } from './ui';
import { FxCard } from '../home/Interactive';

export interface NewsCardData {
  slug: string;
  title: string;
  category: string;
  dateLabel: string;
  dateIso?: string;
  author?: string;
  summary: string;
  image?: string;
  gradient: string;
}

export function NewsBrowser({ items, categories }: { items: NewsCardData[]; categories: string[] }) {
  const [active, setActive] = useState<string>('All');
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of items) m.set(n.category.toLowerCase(), (m.get(n.category.toLowerCase()) ?? 0) + 1);
    return m;
  }, [items]);
  const visible = active === 'All' ? items : items.filter((n) => n.category.toLowerCase() === active.toLowerCase());

  return (
    <div className="flex flex-col gap-10">
      <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Filter news by category">
        <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {['All', ...categories].map((c) => {
            const count = c === 'All' ? items.length : counts.get(c.toLowerCase()) ?? 0;
            return (
              <button key={c} type="button" aria-pressed={active === c} onClick={() => setActive(c)} className={chipClass(active === c)}>
                {c} <span className="ml-1 font-mono text-[11px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'article' : 'articles'} shown
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={<Newspaper />} title="Nothing here yet" description="There are no updates in this category right now — check back soon." />
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((n, i) => (
            <li key={n.slug} className={cn(i === 0 && 'md:col-span-2 lg:col-span-2 lg:row-span-2')}>
              <NewsCard item={n} feature={i === 0} index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NewsCard({ item, feature, index }: { item: NewsCardData; feature?: boolean; index: number }) {
  return (
    <FxCard
      as="article"
      max={feature ? 3 : 5}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface hover:border-gold/30',
        feature && 'min-h-[460px] md:min-h-[520px]'
      )}
    >
      {/* Lead story: the cover fills the card and the text sits on it, magazine-style. */}
      <div className={cn('grain overflow-hidden bg-brand-950', feature ? 'absolute inset-0' : 'relative aspect-[16/10]')}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt={`Featured image for ${item.title}`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" loading="lazy" />
        ) : (
          <>
            <div aria-hidden className="mesh-drift" style={{ background: item.gradient, animationDelay: `${-index * 3}s` }} />
            {feature ? (
              <div className="aurora opacity-90" aria-hidden>
                <i />
              </div>
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: 'radial-gradient(55% 65% at 78% 22%, rgb(var(--lime-rgb) / 0.45), transparent 70%)' }}
              />
            )}
            <span
              aria-hidden
              className={cn(
                'fx-ghost text-outline pointer-events-none absolute -bottom-6 -right-2 select-none font-display font-semibold leading-none tracking-[-0.06em] opacity-60',
                feature ? '-top-10 bottom-auto text-[clamp(220px,28vw,420px)]' : 'text-[120px]'
              )}
            >
              {item.category.slice(0, 1)}
            </span>
          </>
        )}
        <div aria-hidden className={cn('absolute inset-0 bg-gradient-to-t', feature ? 'from-bg via-bg/40 to-transparent' : 'from-bg/50 via-transparent to-transparent')} />
        <span className="absolute left-4 top-4 rounded-full bg-bg/80 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-gold-soft backdrop-blur-md">
          {item.category}
        </span>
      </div>
      <div className={cn('flex flex-col gap-3', feature ? 'relative z-10 mt-auto max-w-[640px] p-6 md:p-10' : 'p-6')}>
        <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-[var(--muted)]">
          <time dateTime={item.dateIso}>{item.dateLabel}</time>
          {item.author && <span> · {item.author}</span>}
        </p>
        <h2
          className={cn(
            'font-display font-medium leading-[1.08] tracking-[-0.035em] text-[var(--fg)] transition-colors group-hover:text-gold-soft',
            feature ? 'text-[clamp(28px,3.2vw,44px)]' : 'text-[22px]'
          )}
        >
          <Link href={`/news/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline">
            {item.title}
          </Link>
        </h2>
        <p className={cn('leading-relaxed', feature ? 'text-[16px] text-[var(--fg-soft)]' : 'line-clamp-3 text-[14.5px] text-[var(--muted)]')}>{item.summary}</p>
        <span className="mt-1 inline-flex w-fit items-center gap-2 text-[13.5px] font-semibold text-[var(--fg)]">
          Read more
          <span className="grid h-8 w-8 place-items-center rounded-full bg-mist/[0.08] transition-all duration-300 group-hover:rotate-45 group-hover:bg-grad-primary group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </span>
        </span>
      </div>
    </FxCard>
  );
}
