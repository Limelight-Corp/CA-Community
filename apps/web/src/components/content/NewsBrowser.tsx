'use client';

import React, { useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Newspaper } from 'lucide-react';
import { EmptyState, Pagination, cn, usePagination } from '@ascend/ui';
import { chipClass } from './ui';

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
  const visible = useMemo(() => (active === 'All' ? items : items.filter((n) => n.category.toLowerCase() === active.toLowerCase())), [items, active]);
  // 9 per page: the feature card fills a 2×2 block, so each page closes on a full row.
  const pager = usePagination(visible, 9, active);
  const listTop = useRef<HTMLDivElement>(null);

  return (
    <div ref={listTop} className="flex flex-col gap-10">
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
          {pager.pageItems.map((n, i) => (
            <li key={n.slug} className={cn(i === 0 && 'md:col-span-2 lg:col-span-2 lg:row-span-2')}>
              <NewsCard item={n} feature={i === 0} index={i} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} noun="articles" scrollTo={listTop} />
    </div>
  );
}

function NewsCard({ item, feature }: { item: NewsCardData; feature?: boolean; index: number }) {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-[24px] border border-mist/[0.09] bg-[var(--card)] p-5 transition-[border-color,box-shadow] duration-300 hover:border-mist/[0.16] hover:shadow-[0_18px_40px_-28px_rgb(var(--mist-rgb)/0.35)] md:p-6',
        feature && 'md:p-8'
      )}
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt={`Featured image for ${item.title}`}
          className={cn('-mx-1 -mt-1 mb-5 w-[calc(100%+0.5rem)] rounded-[18px] object-cover', feature ? 'aspect-[21/9]' : 'aspect-[16/9]')}
          loading="lazy"
        />
      )}
      <p className="flex flex-wrap items-center gap-x-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
        <span className="text-brand-500">{item.category}</span>
        <span aria-hidden>·</span>
        <time dateTime={item.dateIso}>{item.dateLabel}</time>
        {item.author && (
          <>
            <span aria-hidden>·</span>
            <span>{item.author}</span>
          </>
        )}
      </p>
      <h2
        className={cn(
          'mt-4 font-display font-medium leading-[1.15] tracking-[-0.025em] text-[var(--fg)] group-hover:text-brand-500',
          feature ? 'text-[clamp(26px,2.8vw,38px)]' : 'text-[21px]'
        )}
      >
        <Link href={`/news/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none focus-visible:underline">
          {item.title}
        </Link>
      </h2>
      <p className={cn('mt-2.5 leading-relaxed text-[var(--muted)]', feature ? 'max-w-[70ch] text-[16px]' : 'line-clamp-3 text-[14.5px]')}>{item.summary}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13.5px] font-semibold text-[var(--fg)]">
        Read more <ArrowUpRight className="h-4 w-4 text-brand-500" aria-hidden />
      </span>
    </article>
  );
}
