'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, GraduationCap, IndianRupee, Lock, MapPin, Search, Sparkles, X } from 'lucide-react';
import { Pagination, cn, usePagination } from '@ascend/ui';

export interface JobCard {
  slug: string;
  title: string;
  organisation: string;
  type: string;
  location: string;
  workMode: string;
  experience?: string;
  compensation?: string;
  deadline?: string;
  wing?: string;
  logoUrl?: string;
  featured: boolean;
  isMembersOnly: boolean;
}

const selectCls =
  'h-11 rounded-full border border-mist/[0.14] bg-field/80 px-4 text-[13.5px] text-[var(--fg)] outline-none focus:border-brand-500';

const deadlineLabel = (d: string) =>
  `Apply by ${new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;

export function JobBoard({ jobs, types, modes }: { jobs: JobCard[]; types: string[]; modes: string[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [mode, setMode] = useState('');
  const cities = useMemo(() => [...new Set(jobs.map((j) => j.location).filter(Boolean))].sort(), [jobs]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (type && j.type !== type) return false;
      if (city && j.location !== city) return false;
      if (mode && j.workMode !== mode) return false;
      if (!needle) return true;
      return [j.title, j.organisation, j.location, j.type, j.experience, j.wing].filter(Boolean).some((v) => v!.toLowerCase().includes(needle));
    });
  }, [jobs, q, type, city, mode]);

  const filtered = !!(q || type || city || mode);
  const pager = usePagination(shown, 10, [q, type, city, mode]);
  const listTop = useRef<HTMLDivElement>(null);

  return (
    <div ref={listTop} className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Opening type">
        {['', ...types].map((t) => (
          <button
            key={t || 'all'}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={cn(
              'rounded-full border px-4 py-2 text-[13px] font-medium transition',
              type === t ? 'border-gold/60 bg-gold/15 text-gold' : 'border-mist/[0.14] text-[var(--muted)] hover:border-mist/30 hover:text-[var(--fg)]'
            )}
          >
            {t || 'All'}
            <span className="ml-1.5 font-mono text-[11px] opacity-70">{t ? jobs.filter((j) => j.type === t).length : jobs.length}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search openings</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search role, firm, city or skill…"
            className="h-12 w-full rounded-full border border-mist/[0.14] bg-field/80 pl-11 pr-4 text-[14.5px] text-white outline-none placeholder:text-faint focus:border-brand-500"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <select aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Work mode" value={mode} onChange={(e) => setMode(e.target.value)} className={selectCls}>
            <option value="">Any work mode</option>
            {modes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                setType('');
                setCity('');
                setMode('');
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--muted)] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--muted)]" aria-live="polite">
        {shown.length} opening{shown.length === 1 ? '' : 's'}
      </p>

      {shown.length ? (
        <ul className="grid gap-4">
          {pager.pageItems.map((j) => (
            <li key={j.slug}>
              <Link
                href={`/careers/${j.slug}`}
                className={cn(
                  'group flex flex-col gap-4 rounded-[24px] border p-5 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:p-6',
                  j.featured ? 'border-gold/35 bg-gold/[0.05] hover:border-gold/60' : 'border-mist/[0.1] bg-grad-surface hover:border-brand-300/40'
                )}
              >
                {j.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={j.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-white object-contain p-1.5" />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-500/15 text-brand-200">
                    <BriefcaseBusiness className="h-6 w-6" aria-hidden />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-mist/[0.16] px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--fg)]">{j.type}</span>
                    {j.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[11.5px] font-semibold text-gold">
                        <Sparkles className="h-3 w-3" aria-hidden /> Featured
                      </span>
                    )}
                    {j.isMembersOnly && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 px-2.5 py-0.5 text-[11.5px] text-gold">
                        <Lock className="h-3 w-3" aria-hidden /> Members apply
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-[clamp(19px,2vw,23px)] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)] group-hover:text-gold-soft">
                    {j.title}
                  </h2>
                  <p className="mt-0.5 text-[14px] text-[var(--muted)]">{j.organisation}</p>
                  <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[var(--fg-soft)]">
                    <li className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden /> {j.location} · {j.workMode}
                    </li>
                    {j.experience && (
                      <li className="inline-flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden /> {j.experience}
                      </li>
                    )}
                    {j.compensation && (
                      <li className="inline-flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden /> {j.compensation}
                      </li>
                    )}
                    {j.deadline && (
                      <li className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden /> {deadlineLabel(j.deadline)}
                      </li>
                    )}
                  </ul>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 self-start text-[13.5px] font-semibold text-brand-200 group-hover:text-white sm:self-center">
                  View <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[22px] border border-dashed border-mist/[0.14] p-8 text-center text-[14.5px] text-[var(--muted)]">
          {jobs.length ? 'No openings match these filters.' : 'No openings right now — new articleship and job posts appear here as soon as they are shared.'}
        </div>
      )}
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} noun="openings" scrollTo={listTop} />
    </div>
  );
}
