'use client';

import React from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Compass,
  Cpu,
  GraduationCap,
  HeartPulse,
  Network,
  Sparkles,
  Users2,
} from 'lucide-react';
import { EVENTS_PAGE_CONTENT } from '@ascend/shared';

const CATEGORY_ICONS = [
  BookOpen,
  GraduationCap,
  Building2,
  Users2,
  Cpu,
  Compass,
  Network,
  HeartPulse,
];

export function CategoryCards() {
  const handleSelectCategory = (categoryName: string) => {
    // 1. Dispatch custom event so EventsExplorer updates its state immediately
    window.dispatchEvent(
      new CustomEvent('ascend:select-event-category', { detail: categoryName })
    );

    // 2. Update URL without causing a full reload
    const url = new URL(window.location.href);
    url.searchParams.set('category', categoryName);
    url.hash = 'events-calendar';
    window.history.replaceState(null, '', url.toString());

    // 3. Smoothly scroll down to the calendar & filter bar
    const target = document.getElementById('events-calendar');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {EVENTS_PAGE_CONTENT.categoriesSection.categories.map((cat, idx) => {
        const Icon = CATEGORY_ICONS[idx] || Sparkles;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelectCategory(cat.name)}
            className="shine group flex flex-col justify-between text-left rounded-[24px] border border-mist/[0.1] bg-grad-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/10 text-brand-300 transition group-hover:bg-brand-500/20 group-hover:text-gold">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-[12px] font-medium tracking-[0.1em] text-[var(--muted)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[19px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)] group-hover:text-gold">
                {cat.name}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
                {cat.description}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-300">
              <span>Explore events</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
            </div>
          </button>
        );
      })}
    </div>
  );
}
