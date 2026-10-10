'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../utils';

/** Page numbers to show: always first and last, the current page ±1, and gaps as null. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((p) => set.add(p));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push(null);
    out.push(p);
  });
  return out;
}

/**
 * Client-side paging over an already filtered list. The page resets to 1 whenever `resetKey`
 * changes (pass the active filters) and is clamped when the list shrinks.
 */
export function usePagination<T>(items: readonly T[], pageSize: number, resetKey?: unknown) {
  const [page, setPage] = useState(1);
  const key = JSON.stringify(resetKey ?? null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPage(1);
  }, [key]);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pages);
  const pageItems = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);
  return { page: current, pages, setPage, pageItems, total: items.length, pageSize };
}

export interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  /** What is being paged, e.g. "events" — used in the summary and the nav label. */
  noun?: string;
  /** Element to bring into view after changing page (the top of the list). */
  scrollTo?: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function Pagination({ page, pages, total, pageSize, onChange, noun = 'items', scrollTo, className }: PaginationProps) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const go = (p: number) => {
    if (p < 1 || p > pages || p === page) return;
    onChange(p);
    const el = scrollTo?.current;
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      if (el.getBoundingClientRect().top < 0) window.scrollTo({ top, behavior: 'smooth' });
    }
  };
  const btn =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-full border px-3 text-[13px] font-medium tabular-nums transition disabled:pointer-events-none disabled:opacity-35';
  const idle = 'border-[rgb(var(--mist-rgb)/0.14)] text-[var(--muted)] hover:border-[rgb(var(--mist-rgb)/0.35)] hover:text-[var(--fg)]';
  return (
    <nav aria-label={`${noun} pages`} className={cn('flex flex-col items-center justify-between gap-3 pt-6 sm:flex-row', className)}>
      <p className="text-[12.5px] text-[var(--muted)] tabular-nums" aria-live="polite">
        Showing {from.toLocaleString('en-IN')}–{to.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} {noun}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button type="button" className={cn(btn, idle)} onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page">
          ‹ <span className="ml-1 hidden sm:inline">Prev</span>
        </button>
        {pageWindow(page, pages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="px-1 text-[13px] text-[var(--muted)]" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={cn(btn, p === page ? 'border-transparent bg-[var(--brand-500)] text-white' : idle)}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={cn(btn, idle)} onClick={() => go(page + 1)} disabled={page === pages} aria-label="Next page">
          <span className="mr-1 hidden sm:inline">Next</span> ›
        </button>
      </div>
    </nav>
  );
}
