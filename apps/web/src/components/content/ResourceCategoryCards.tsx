'use client';

import React from 'react';
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Cpu,
  GraduationCap,
  PlayCircle,
  Scale,
  Sparkles,
} from 'lucide-react';
import { BLUEPRINT_RESOURCE_CATEGORIES } from '@ascend/shared';

const CATEGORY_ICONS = [
  Scale,
  BarChart3,
  Briefcase,
  GraduationCap,
  Cpu,
  PlayCircle,
];

export function ResourceCategoryCards() {
  const handleSelectCategory = (categoryTitle: string) => {
    // 1. Dispatch custom event so ResourceLibrary updates its state immediately
    window.dispatchEvent(
      new CustomEvent('ascend:select-resource-category', { detail: categoryTitle })
    );

    // 2. Update URL without causing a full reload
    const url = new URL(window.location.href);
    url.searchParams.set('category', categoryTitle);
    url.hash = 'resource-library';
    window.history.replaceState(null, '', url.toString());

    // 3. Smoothly scroll down to the library & filter bar
    const target = document.getElementById('resource-library');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {BLUEPRINT_RESOURCE_CATEGORIES.map((cat, idx) => {
        const Icon = CATEGORY_ICONS[idx] || Sparkles;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleSelectCategory(cat.title)}
            className="shine group flex flex-col justify-between text-left rounded-[24px] border border-mist/[0.1] bg-grad-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500/10 text-brand-300 transition group-hover:bg-brand-500/20 group-hover:text-gold">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-[11.5px] font-medium tracking-[0.1em] text-[var(--muted)]">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 font-display text-[19px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)] group-hover:text-gold">
                {cat.title}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
                {cat.description}
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-brand-300">
              <span>Explore resources</span>
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
