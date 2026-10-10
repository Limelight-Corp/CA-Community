'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarSearch, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { EmptyState, Pagination, Reveal, cn, fieldInputClass, usePagination } from '@ascend/ui';
import { EventTile } from './EventTile';
import { eventDate, eventSpeakers, eventWing, isUpcoming, sortByDate } from '../../lib/events';

type When = 'any' | 'upcoming' | 'this-month' | 'next-30' | 'past' | `m:${string}`;
type Mode = 'all' | 'Online' | 'Offline';
type Price = 'all' | 'free' | 'paid';

export interface EventsExplorerProps {
  events: CommunityEvent[];
  wings: CommunityWing[];
  speakers: CommunitySpeaker[];
  /** Admin-managed event categories (plus any still used by events). */
  categories: string[];
  initialCategory?: string;
  initialQuery?: string;
}

const monthKey = (e: CommunityEvent) => e.date.slice(0, 7);
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/** Filterable event listing (Website Checklist §19). */
export function EventsExplorer({ events, wings, speakers, categories, initialCategory, initialQuery }: EventsExplorerProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [category, setCategory] = useState<string>(
    initialCategory && categories.includes(initialCategory) ? initialCategory : 'All'
  );
  const [when, setWhen] = useState<When>('any');
  const [city, setCity] = useState('all');
  const [mode, setMode] = useState<Mode>('all');
  const [price, setPrice] = useState<Price>('all');
  const [panelOpen, setPanelOpen] = useState(false);

  // Keep the URL shareable without triggering navigation.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (category === 'All') params.delete('category');
    else params.set('category', category);
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [category, query]);

  const cities = useMemo(
    () => Array.from(new Set(events.filter((e) => e.mode === 'Offline' && e.city).map((e) => e.city.trim()))).sort(),
    [events]
  );
  const months = useMemo(() => Array.from(new Set(events.map(monthKey))).sort(), [events]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in30 = new Date(today.getTime() + 30 * 86_400_000);

    return events.filter((e) => {
      if (category !== 'All') {
        const isOnlineChip = category === 'Online';
        if (isOnlineChip ? e.mode !== 'Online' && e.category !== 'Online' : e.category !== category) return false;
      }
      if (mode !== 'all' && e.mode !== mode) return false;
      if (price === 'free' && e.fee > 0) return false;
      if (price === 'paid' && !(e.fee > 0)) return false;
      if (city !== 'all' && (e.mode !== 'Offline' || e.city.trim() !== city)) return false;

      const d = eventDate(e);
      if (when === 'upcoming' && !isUpcoming(e)) return false;
      if (when === 'past' && isUpcoming(e)) return false;
      if (when === 'this-month' && (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear())) return false;
      if (when === 'next-30' && (d < today || d > in30)) return false;
      if (when.startsWith('m:') && monthKey(e) !== when.slice(2)) return false;

      if (q) {
        const wing = eventWing(e, wings);
        const hay = [e.title, e.description, e.city, e.venue, e.category, wing?.name, ...eventSpeakers(e, speakers).map((s) => s.name)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, wings, speakers, query, category, when, city, mode, price]);

  const upcoming = useMemo(() => sortByDate(matches.filter((e) => isUpcoming(e))), [matches]);
  const past = useMemo(() => sortByDate(matches.filter((e) => !isUpcoming(e))).reverse(), [matches]);
  const filterKey = [query, category, when, city, mode, price];
  const upcomingPager = usePagination(upcoming, 9, filterKey);
  const pastPager = usePagination(past, 9, filterKey);
  const upcomingTop = useRef<HTMLElement>(null);
  const pastTop = useRef<HTMLElement>(null);

  const activeCount =
    (when !== 'any' ? 1 : 0) + (city !== 'all' ? 1 : 0) + (mode !== 'all' ? 1 : 0) + (price !== 'all' ? 1 : 0);
  const anyFilter = activeCount > 0 || category !== 'All' || query.trim() !== '';

  const reset = () => {
    setQuery('');
    setCategory('All');
    setWhen('any');
    setCity('all');
    setMode('all');
    setPrice('all');
  };

  const chip = (active: boolean) =>
    cn(
      'shrink-0 rounded-full border px-4 py-2 text-[13.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
      active
        ? 'border-transparent bg-grad-primary text-white shadow-[0_8px_24px_-12px_rgb(var(--lime-rgb)/0.9)]'
        : 'border-mist/[0.14] text-[var(--muted)] hover:border-mist/30 hover:text-[var(--fg)]'
    );

  const seg = <T extends string>(value: T, current: T, set: (v: T) => void, label: string) => (
    <button
      key={value}
      type="button"
      aria-pressed={current === value}
      onClick={() => set(value)}
      className={cn(
        'flex-1 rounded-full px-3 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
        current === value ? 'bg-mist/[0.12] text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'
      )}
    >
      {label}
    </button>
  );

  const selectClass = cn(fieldInputClass, 'appearance-none py-3 pr-10');
  const chevron = (
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Filter bar */}
      <div className="glass-panel relative z-10 flex flex-col gap-4 rounded-[28px] p-3 md:p-4" role="search" aria-label="Filter events">
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--muted)]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, speakers, cities…"
              className={cn(fieldInputClass, 'rounded-full py-3 pl-11')}
            />
          </label>
          <button
            type="button"
            onClick={() => setPanelOpen((o) => !o)}
            aria-expanded={panelOpen}
            aria-controls="event-filters"
            className={cn(
              'relative inline-flex h-[50px] shrink-0 lg:hidden items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
              panelOpen ? 'border-brand-300/60 bg-brand-500/15 text-[var(--fg)]' : 'border-mist/[0.14] text-[var(--fg)] hover:border-mist/30'
            )}
          >
            <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 font-mono text-[11px] font-semibold text-brand-950">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Category chips */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label="Event type">
          {['All', ...categories].map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={chip(category === c)}>
              {c}
            </button>
          ))}
        </div>

        <div id="event-filters" className={cn(panelOpen ? 'grid' : 'hidden lg:grid', 'gap-3 border-t border-mist/[0.08] pt-4 sm:grid-cols-2 lg:grid-cols-4')}>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]">Date</span>
            <span className="relative">
            <select value={when} onChange={(e) => setWhen(e.target.value as When)} className={selectClass}>
              <option value="any">Any date</option>
              <option value="upcoming">Upcoming only</option>
              <option value="this-month">This month</option>
              <option value="next-30">Next 30 days</option>
              <option value="past">Past events</option>
              {months.length > 0 && (
                <optgroup label="By month">
                  {months.map((m) => (
                    <option key={m} value={`m:${m}`}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            {chevron}
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]">Location</span>
            <span className="relative">
            <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
              <option value="all">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {chevron}
            </span>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]" id="f-mode">Format</span>
            <div className="flex rounded-full border border-mist/[0.12] p-1" role="group" aria-labelledby="f-mode">
              {seg<Mode>('all', mode, setMode, 'All')}
              {seg<Mode>('Offline', mode, setMode, 'In person')}
              {seg<Mode>('Online', mode, setMode, 'Online')}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]" id="f-price">Price</span>
            <div className="flex rounded-full border border-mist/[0.12] p-1" role="group" aria-labelledby="f-price">
              {seg<Price>('all', price, setPrice, 'All')}
              {seg<Price>('free', price, setPrice, 'Free')}
              {seg<Price>('paid', price, setPrice, 'Paid')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3" aria-live="polite">
        <p className="text-[14px] text-[var(--muted)]">
          <span className="font-display text-[var(--fg)]">{upcoming.length}</span> upcoming
          {past.length > 0 && (
            <>
              {' · '}
              <span className="font-display text-[var(--fg)]">{past.length}</span> past
            </>
          )}
          {anyFilter && ' matching your filters'}
        </p>
        {anyFilter && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-brand-200 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear all
          </button>
        )}
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={<CalendarSearch />}
          title="No events match that combo"
          description="Try a different date, city or type — or clear the filters to see everything on the calendar."
          action={
            anyFilter ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white"
              >
                <X className="h-4 w-4" aria-hidden /> Clear filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section ref={upcomingTop} aria-labelledby="upcoming-h" className="flex flex-col gap-6">
              <h2 id="upcoming-h" className="flex items-baseline gap-3 font-display text-[clamp(28px,3.4vw,44px)] font-medium tracking-[-0.04em] text-[var(--fg)]">
                Coming up
                <span className="font-mono text-[12px] tracking-[0.1em] text-gold">{String(upcoming.length).padStart(2, '0')}</span>
              </h2>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingPager.pageItems.map((e, i) => (
                  <Reveal as="li" key={e.id} delay={Math.min(i, 5) * 70} className="flex">
                    <EventTile className="w-full" event={e} wing={eventWing(e, wings)} speakers={eventSpeakers(e, speakers)} />
                  </Reveal>
                ))}
              </ul>
              <Pagination page={upcomingPager.page} pages={upcomingPager.pages} total={upcomingPager.total} pageSize={upcomingPager.pageSize} onChange={upcomingPager.setPage} noun="upcoming events" scrollTo={upcomingTop} className="pt-0" />
            </section>
          )}

          {past.length > 0 && (
            <section ref={pastTop} aria-labelledby="past-h" className="flex flex-col gap-6 border-t border-mist/[0.08] pt-10">
              <h2 id="past-h" className="flex items-baseline gap-3 font-display text-[clamp(24px,2.8vw,36px)] font-medium tracking-[-0.04em] text-[var(--muted)]">
                Past events
                <span className="font-mono text-[12px] tracking-[0.1em]">{String(past.length).padStart(2, '0')}</span>
              </h2>
              <ul className="grid grid-cols-1 gap-5 opacity-80 sm:grid-cols-2 lg:grid-cols-3">
                {pastPager.pageItems.map((e) => (
                  <li key={e.id} className="flex">
                    <EventTile className="w-full" event={e} wing={eventWing(e, wings)} speakers={eventSpeakers(e, speakers)} />
                  </li>
                ))}
              </ul>
              <Pagination page={pastPager.page} pages={pastPager.pages} total={pastPager.total} pageSize={pastPager.pageSize} onChange={pastPager.setPage} noun="past events" scrollTo={pastTop} className="pt-0" />
            </section>
          )}
        </>
      )}
    </div>
  );
}
