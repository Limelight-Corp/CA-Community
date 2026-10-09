'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, FileText, Lock, Search, X } from 'lucide-react';
import { EmptyState, cn, fieldInputClass } from '@ascend/ui';
import { chipClass } from './ui';

export interface ResourceCardData {
  id: string;
  title: string;
  category: string;
  format: string;
  isMembersOnly: boolean;
  /** Only present for public resources — members-only file links are never sent to the browser. */
  fileUrl?: string;
  isDownload?: boolean;
}

export function ResourceLibrary({ items, categories }: { items: ResourceCardData[]; categories: string[] }) {
  const [active, setActive] = useState('All');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (r) =>
        (active === 'All' || r.category.toLowerCase() === active.toLowerCase()) &&
        (!q || `${r.title} ${r.category} ${r.format}`.toLowerCase().includes(q))
    );
  }, [items, active, query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="relative max-w-[560px]">
          <label htmlFor="resource-search" className="sr-only">
            Search resources
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
          <input
            id="resource-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides, tax updates, webinars…"
            className={cn(fieldInputClass, 'rounded-full pl-12 pr-12')}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-[var(--muted)] hover:text-[var(--fg)]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0" role="group" aria-label="Filter resources by category">
          <div className="flex w-max gap-2 md:w-auto md:flex-wrap">
            {['All', ...categories].map((c) => (
              <button key={c} type="button" aria-pressed={active === c} onClick={() => setActive(c)} className={chipClass(active === c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)]" aria-live="polite">
        {visible.length} {visible.length === 1 ? 'resource' : 'resources'}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={<FileText />} title="No resources match" description="Try a different keyword or category. New material is added regularly." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((r, i) => (
            <li key={r.id}>
              <ResourceCard r={r} index={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResourceCard({ r, index }: { r: ResourceCardData; index: number }) {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col gap-6 overflow-hidden rounded-[26px] border p-6 transition-transform duration-500 hover:-translate-y-1',
        r.isMembersOnly ? 'border-gold/25 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] text-[var(--muted)]">{String(index + 1).padStart(2, '0')}</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-brand-500/15 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-200">{r.format}</span>
          {r.isMembersOnly && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-gold-soft">
              <Lock className="h-3 w-3" aria-hidden /> Members only
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[12.5px] text-[var(--muted)]">{r.category}</span>
        <h2 className="font-display text-[22px] font-medium leading-[1.15] tracking-[-0.03em] text-[var(--fg)]">{r.title}</h2>
      </div>
      <div className="mt-auto border-t border-[var(--line)] pt-4">
        {r.isMembersOnly ? (
          <Link href="/join" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-gold hover:text-gold-soft">
            <Lock className="h-4 w-4" aria-hidden /> Join to unlock<span className="sr-only">: {r.title}</span>
          </Link>
        ) : r.fileUrl ? (
          <a
            href={r.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            {...(r.isDownload ? { download: '' } : {})}
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--fg)] hover:text-brand-200"
          >
            {r.isDownload ? <Download className="h-4 w-4" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
            {r.isDownload ? 'Download' : 'Open'}
            <span className="sr-only">: {r.title}</span>
          </a>
        ) : (
          <span className="text-[13.5px] text-[var(--muted)]">Coming soon</span>
        )}
      </div>
    </article>
  );
}
