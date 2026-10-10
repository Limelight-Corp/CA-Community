'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { wingSlug } from '@ascend/shared';
import { cn } from '@ascend/ui';

export interface WingView {
  number: number;
  name: string;
  color: string;
  focus: string[];
  activities: string[];
}

/**
 * The 10 professional wings as an accordion. Each row expands to show its focus areas
 * and the 10 proposed activities from the organisation structure document.
 */
export function WingsExplorer({ wings }: { wings: WingView[] }) {
  const [open, setOpen] = useState<number | null>(wings[0]?.number ?? null);

  return (
    <ol className="flex flex-col border-t border-[var(--line)]">
      {wings.map((wing) => {
        const isOpen = open === wing.number;
        const panelId = `wing-panel-${wing.number}`;
        const buttonId = `wing-button-${wing.number}`;
        const num = String(wing.number).padStart(2, '0');
        return (
          <li
            key={wing.number}
            className="group/wing relative border-b border-[var(--line)]"
            style={{ ['--wing' as string]: wing.color }}
          >
            {/* colour wash when open */}
            <span
              aria-hidden
              className={cn('pointer-events-none absolute inset-0 transition-opacity duration-500', isOpen ? 'opacity-100' : 'opacity-0')}
              style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${wing.color} 16%, transparent), transparent 70%)` }}
            />
            <h3 className="relative">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : wing.number)}
                className="flex w-full items-center gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-300 md:gap-8 md:py-8"
              >
                <span
                  className="w-[2.2ch] shrink-0 font-mono text-[13px] tracking-[0.1em] md:text-[15px]"
                  style={{ color: wing.color }}
                >
                  {num}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span
                    className={cn(
                      'font-display text-[clamp(24px,4.2vw,58px)] font-medium leading-[0.98] tracking-[-0.045em] transition-[transform,color] duration-500 md:group-hover/wing:translate-x-3',
                      isOpen ? 'text-fg' : 'text-fg/75'
                    )}
                  >
                    {wing.name}
                  </span>
                  <span className="hidden truncate text-[13px] text-[var(--muted)] sm:block">{wing.focus.join(' · ')}</span>
                </span>
                <span
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-full border transition-all duration-500',
                    isOpen ? 'rotate-45 border-transparent text-bg' : 'border-mist/[0.16] text-[var(--fg)]'
                  )}
                  style={isOpen ? { background: wing.color } : undefined}
                  aria-hidden
                >
                  <Plus className="h-5 w-5" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="relative pb-10 pl-[calc(2.2ch+1rem)] md:pl-[calc(2.2ch+2rem)]"
            >
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,2fr)]">
                <div className="flex flex-col gap-3">
                  <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Focus areas</h4>
                  <ul className="flex flex-wrap gap-2">
                    {wing.focus.map((f) => (
                      <li
                        key={f}
                        className="rounded-full border px-3 py-1.5 text-[13px] text-[var(--fg)]"
                        style={{ borderColor: `color-mix(in srgb, ${wing.color} 55%, transparent)` }}
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                    Proposed activities <span className="text-gold">· {wing.activities.length}</span>
                  </h4>
                  <ol className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
                    {wing.activities.map((a, i) => (
                      <li key={a} className="flex items-baseline gap-3 border-b border-[var(--line)] py-2.5 text-[14.5px] text-[var(--fg)]">
                        <span className="w-6 shrink-0 font-mono text-[11px] text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>
                        {a}
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={`/wings/${wingSlug(wing.name)}`}
                    className="group mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-grad-primary px-4 py-2 text-[13.5px] font-semibold text-white hover:brightness-110"
                  >
                    Open the {wing.name} wing
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
