'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Download, ExternalLink, FileSpreadsheet, FileText, Lock, PlayCircle, Search, X } from 'lucide-react';
import { EmptyState, cn, fieldInputClass } from '@ascend/ui';
import { chipClass } from './ui';
import { FxCard } from '../home/Interactive';

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
          {visible.map((r, i) => {
            // Widen the first card when it makes the grid come out even (no orphan in the last row).
            const wideMd = i === 0 && visible.length % 2 === 1 && visible.length > 1;
            const wideXl = i === 0 && (visible.length + 1) % 3 === 0;
            return (
              <li key={r.id} className={cn(wideMd ? 'md:col-span-2' : 'md:col-span-1', wideXl ? 'xl:col-span-2' : 'xl:col-span-1')}>
                <ResourceCard r={r} index={i} wide={wideMd || wideXl} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Icon by the first word of the format, e.g. "Video · 74 min" → video. */
const FORMAT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  video: PlayCircle,
  webinar: PlayCircle,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  guide: BookOpen,
  article: BookOpen,
};

function ResourceCard({ r, index, wide }: { r: ResourceCardData; index: number; wide?: boolean }) {
  const Icon = FORMAT_ICON[r.format.toLowerCase().split(/[^a-z]+/)[0] ?? ''] ?? FileText;
  return (
    <FxCard
      as="article"
      max={5}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-[26px] border',
        wide && 'md:flex-row',
        r.isMembersOnly ? 'holo border-gold/30 bg-gold/[0.05]' : 'border-mist/[0.1] bg-grad-surface'
      )}
    >
      {/* Cover strip */}
      <div className={cn('grain relative shrink-0 overflow-hidden bg-brand-950', wide ? 'h-[140px] md:h-auto md:w-[42%]' : 'h-[96px]')}>
        <div
          aria-hidden
          className="mesh-drift"
          style={{
            background: r.isMembersOnly
              ? 'radial-gradient(45% 60% at 65% 40%, rgb(var(--gold-rgb) / 0.6), transparent 70%), radial-gradient(40% 50% at 30% 70%, rgb(var(--lime-rgb) / 0.35), transparent 70%), linear-gradient(150deg, var(--brand-800), var(--brand-950))'
              : 'radial-gradient(45% 60% at 65% 35%, rgb(var(--lime-rgb) / 0.75), transparent 70%), radial-gradient(40% 55% at 30% 70%, rgb(var(--gold-rgb) / 0.32), transparent 70%), linear-gradient(150deg, var(--brand-800), var(--brand-950))',
            animationDelay: `${-index * 3}s`,
          }}
        />
        <span
          aria-hidden
          className="fx-ghost text-outline pointer-events-none absolute -bottom-5 right-3 select-none font-display text-[110px] font-semibold leading-none tracking-[-0.06em] opacity-70"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="fx-icon absolute left-5 top-5 grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <div className={cn('flex flex-1 flex-col gap-5 p-6', wide && 'md:p-8')}>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-brand-500/15 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-brand-200">{r.format}</span>
          {r.isMembersOnly && (
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-gold-soft">
              <Lock className="h-3 w-3" aria-hidden /> Members only
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] text-[var(--muted)]">{r.category}</span>
          <h2
            className={cn(
              'font-display font-medium leading-[1.12] tracking-[-0.03em] text-[var(--fg)] transition-colors group-hover:text-gold-soft',
              wide ? 'text-[clamp(24px,2.4vw,32px)]' : 'text-[22px]'
            )}
          >
            {r.title}
          </h2>
        </div>
        <div className="mt-auto border-t border-[var(--line)] pt-4">
          {r.isMembersOnly ? (
            <Link href="/join" className="relative z-10 inline-flex items-center gap-2 text-[13.5px] font-semibold text-gold hover:text-gold-soft">
              <Lock className="h-4 w-4" aria-hidden /> Join to unlock<span className="sr-only">: {r.title}</span>
            </Link>
          ) : r.fileUrl ? (
            <a
              href={r.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              {...(r.isDownload ? { download: '' } : {})}
              className="relative z-10 inline-flex items-center gap-2 text-[13.5px] font-semibold text-[var(--fg)] hover:text-brand-200"
            >
              {r.isDownload ? <Download className="h-4 w-4" aria-hidden /> : <ExternalLink className="h-4 w-4" aria-hidden />}
              {r.isDownload ? 'Download' : 'Open'}
              <span className="sr-only">: {r.title}</span>
            </a>
          ) : (
            <span className="text-[13.5px] text-[var(--muted)]">Coming soon</span>
          )}
        </div>
      </div>
    </FxCard>
  );
}
