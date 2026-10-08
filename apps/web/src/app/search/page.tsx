'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Badge, ArrowIcon } from '@ascend/ui';
import {
  PROTOTYPE_EVENTS,
  PROTOTYPE_SPEAKERS,
  PROTOTYPE_WINGS,
  PROTOTYPE_RESOURCES,
} from '@ascend/shared';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EVENTS' | 'SPEAKERS' | 'WINGS' | 'RESOURCES'>('ALL');

  const filterTabs = [
    { id: 'ALL', label: 'All Results' },
    { id: 'EVENTS', label: 'Events' },
    { id: 'SPEAKERS', label: 'Speakers' },
    { id: 'WINGS', label: 'Wings' },
    { id: 'RESOURCES', label: 'Resources' },
  ] as const;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matchedEvents = PROTOTYPE_EVENTS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    ).map((e) => ({
      type: 'EVENT' as const,
      title: e.title,
      subtitle: `${e.date} · ${e.city} (${e.mode})`,
      link: `/events/${e.slug}`,
      badge: 'Event',
    }));

    const matchedSpeakers = Object.values(PROTOTYPE_SPEAKERS).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.bio.toLowerCase().includes(q) ||
        s.expertise.some((exp) => exp.toLowerCase().includes(q))
    ).map((s) => ({
      type: 'SPEAKER' as const,
      title: s.name,
      subtitle: s.title,
      link: `/speakers/${s.slug}`,
      badge: 'Speaker',
    }));

    const matchedWings = PROTOTYPE_WINGS.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.tags.toLowerCase().includes(q) ||
        w.activities.some((act) => act.toLowerCase().includes(q))
    ).map((w) => ({
      type: 'WING' as const,
      title: `Wing ${String(w.number).padStart(2, '0')}: ${w.name}`,
      subtitle: w.tags,
      link: '/wings',
      badge: 'Wing',
    }));

    const matchedResources = PROTOTYPE_RESOURCES.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.format.toLowerCase().includes(q)
    ).map((r) => ({
      type: 'RESOURCE' as const,
      title: r.title,
      subtitle: `${r.category} · ${r.format}`,
      link: '/resources',
      badge: 'Resource',
    }));

    let all = [...matchedEvents, ...matchedSpeakers, ...matchedWings, ...matchedResources];

    if (typeFilter === 'EVENTS') all = matchedEvents;
    else if (typeFilter === 'SPEAKERS') all = matchedSpeakers;
    else if (typeFilter === 'WINGS') all = matchedWings;
    else if (typeFilter === 'RESOURCES') all = matchedResources;

    return all;
  }, [query, typeFilter]);

  return (
    <WebShell>
      {/* Header & Search Input */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[1000px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Global Index</Eyebrow>
          <Heading level="h1" className="text-[clamp(36px,5cqi,64px)] mt-4 mb-8">
            Search{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
              ASCEND.
            </em>
          </Heading>

          <div className="relative">
            <input
              type="text"
              autoFocus
              placeholder="Search across events, speakers, wings, practice resources..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--surface-muted)] text-[var(--fg)] border border-[var(--line-strong)] rounded-[var(--r)] px-5 py-4 text-[16px] md:text-[18px] outline-none focus:border-[var(--accent)] shadow-xl transition-all placeholder:text-[var(--faint)]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-mono text-[var(--muted)] hover:text-[var(--fg)] px-2 py-1 bg-[var(--surface)] rounded border border-[var(--line)]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-6 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="max-w-[1000px] mx-auto px-5 md:px-8 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-4 py-1.5 rounded-[var(--r-full)] text-[13px] font-medium transition-all ${
                typeFilter === tab.id
                  ? 'bg-[var(--accent)] text-white shadow-sm'
                  : 'bg-[var(--surface-muted)] text-[var(--muted)] hover:text-[var(--fg)] border border-[var(--line)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Search Results */}
      <section className="py-16 md:py-24 max-w-[1000px] mx-auto px-5 md:px-8">
        {!query.trim() ? (
          <div className="text-center py-16 flex flex-col items-center">
            <p className="text-[17px] text-[var(--muted)] max-w-[44ch] leading-relaxed">
              Type keywords such as <span className="text-[var(--accent)] font-mono">"GST"</span>,{' '}
              <span className="text-[var(--accent)] font-mono">"AI"</span>,{' '}
              <span className="text-[var(--accent)] font-mono">"Rohan Mehta"</span>, or{' '}
              <span className="text-[var(--accent)] font-mono">"Budget"</span> to discover content.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8">
            <h3 className="font-display text-[20px] font-medium text-[var(--fg)] mb-2">
              No matching records found
            </h3>
            <p className="text-[14.5px] text-[var(--muted)]">
              No entities matched <span className="font-mono text-[var(--accent)]">"{query}"</span> in this category. Try broader terms.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <span className="text-[12px] font-mono text-[var(--muted)] mb-2">
              Found {results.length} result{results.length === 1 ? '' : 's'}
            </span>

            {results.map((res, idx) => (
              <Link
                key={idx}
                href={res.link}
                className="group p-5 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-elevated)] transition-all flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={res.badge === 'Event' ? 'green' : res.badge === 'Speaker' ? 'purple' : 'blue'}>
                      {res.badge}
                    </Badge>
                    <h3 className="font-display text-[17px] font-medium text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
                      {res.title}
                    </h3>
                  </div>
                  <p className="text-[13.5px] text-[var(--muted)]">{res.subtitle}</p>
                </div>

                <div className="text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                  <ArrowIcon size={16} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </WebShell>
  );
}
