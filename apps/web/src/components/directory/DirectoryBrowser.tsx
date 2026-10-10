'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, GraduationCap, Linkedin, MapPin, Search, UserRoundPlus, X } from 'lucide-react';
import { cn } from '@ascend/ui';
import type { DirectoryEntry } from '../../lib/directory';
import { getInitials } from '../../context/AuthContext';

const selectCls =
  'h-11 rounded-full border border-mist/[0.14] bg-field/80 px-4 text-[13.5px] text-[var(--fg)] outline-none focus:border-brand-500';

export function DirectoryBrowser({
  entries,
  wings,
  selfListed,
}: {
  entries: DirectoryEntry[];
  wings: { number: number; name: string }[];
  selfListed: boolean;
}) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [wing, setWing] = useState('');
  const [plan, setPlan] = useState('');

  const cities = useMemo(() => [...new Set(entries.map((e) => e.city).filter(Boolean) as string[])].sort(), [entries]);
  const plans = useMemo(() => [...new Set(entries.map((e) => e.plan))].sort(), [entries]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((e) => {
      if (city && e.city !== city) return false;
      if (plan && e.plan !== plan) return false;
      if (wing && !e.wings.some((w) => String(w.number) === wing)) return false;
      if (!needle) return true;
      return [e.name, e.organisation, e.designation, e.areaOfPractice, e.city, e.bio, ...e.wings.map((w) => w.name)]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(needle));
    });
  }, [entries, q, city, wing, plan]);

  const filtered = !!(q || city || wing || plan);

  return (
    <div className="flex flex-col gap-8">
      {!selfListed && (
        <div className="flex flex-col gap-3 rounded-[22px] border border-brand-300/25 bg-brand-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-[14px] text-[var(--fg)]">
            <UserRoundPlus className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden />
            Your profile isn’t listed yet. Turn on “Show me in the member directory” in your dashboard so other members can find you.
          </p>
          <Link href="/dashboard?tab=profile" className="shrink-0 text-[13.5px] font-semibold text-brand-200 hover:text-white">
            Update my profile →
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, firm, expertise or wing…"
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
          <select aria-label="Wing" value={wing} onChange={(e) => setWing(e.target.value)} className={selectCls}>
            <option value="">All wings</option>
            {wings.map((w) => (
              <option key={w.number} value={w.number}>
                {w.name}
              </option>
            ))}
          </select>
          {plans.length > 1 && (
            <select aria-label="Membership" value={plan} onChange={(e) => setPlan(e.target.value)} className={selectCls}>
              <option value="">All memberships</option>
              {plans.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          )}
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                setCity('');
                setWing('');
                setPlan('');
              }}
              className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[13px] text-[var(--muted)] hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden /> Clear
            </button>
          )}
        </div>
      </div>

      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--muted)]" aria-live="polite">
        {shown.length} of {entries.length} member{entries.length === 1 ? '' : 's'}
      </p>

      {shown.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => (
            <li key={e.id} className="min-w-0">
              <MemberCard e={e} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[22px] border border-dashed border-mist/[0.14] p-8 text-center text-[14.5px] text-[var(--muted)]">
          {entries.length ? 'No members match these filters.' : 'No members have listed their profile yet — be the first from your dashboard.'}
        </div>
      )}
    </div>
  );
}

function MemberCard({ e }: { e: DirectoryEntry }) {
  return (
    <article className="flex h-full flex-col rounded-[26px] border border-mist/[0.1] bg-grad-surface p-6 transition hover:border-brand-300/40">
      <div className="flex items-center gap-4">
        {e.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-gold/40" />
        ) : (
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-grad-primary text-[18px] font-semibold text-white ring-2 ring-gold/30">
            {getInitials(e.name)}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-display text-[19px] font-medium tracking-[-0.02em] text-[var(--fg)]">{e.name}</h3>
          {(e.designation || e.organisation) && (
            <p className="truncate text-[13.5px] text-[var(--muted)]">{[e.designation, e.organisation].filter(Boolean).join(' · ')}</p>
          )}
          <span className="mt-1 inline-block rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold">{e.plan}</span>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-1.5 text-[13.5px] text-[var(--fg-soft)]">
        {e.city && (
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden /> {e.city}
          </li>
        )}
        {e.areaOfPractice && (
          <li className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden /> <span className="truncate">{e.areaOfPractice}</span>
          </li>
        )}
        {e.qualificationYear && (
          <li className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden /> Qualified {e.qualificationYear}
          </li>
        )}
      </ul>

      {e.bio && <p className="mt-4 line-clamp-3 text-[13.5px] leading-relaxed text-[var(--muted)]">{e.bio}</p>}

      {e.wings.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {e.wings.map((w) => (
            <Link key={w.number} href={`/wings/${w.slug}`} className="rounded-full border border-mist/[0.14] px-2.5 py-1 text-[11.5px] text-[var(--muted)] hover:border-gold/50 hover:text-gold">
              {w.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-auto pt-5">
        {e.linkedinUrl ? (
          <a
            href={e.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.16] px-4 text-[13.5px] font-semibold text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10')}
          >
            <Linkedin className="h-4 w-4" aria-hidden /> Connect on LinkedIn<span className="sr-only">: {e.name}</span>
          </a>
        ) : (
          <span className="text-[12.5px] text-[var(--muted)]">No LinkedIn shared</span>
        )}
      </div>
    </article>
  );
}
