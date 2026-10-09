'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@ascend/ui';

export interface OrbitWing {
  id: string;
  number: number;
  name: string;
  color: string;
  tags: string;
  activities: string[];
}

/**
 * The ten wings orbiting the community, with a synced list beside it on large screens.
 * Hovering or focusing a wing (in the list or the orbit) pauses the orbit, highlights the
 * wing and shows its focus areas and first proposed activities in the centre.
 */
export function WingsOrbit({ wings }: { wings: OrbitWing[] }) {
  const [active, setActive] = useState<OrbitWing | null>(null);
  const n = wings.length;
  const handlers = (w: OrbitWing) => ({
    onPointerEnter: () => setActive(w),
    onPointerLeave: () => setActive(null),
    onFocus: () => setActive(w),
    onBlur: () => setActive(null),
  });

  return (
    <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {/* Synced list (large screens) */}
      <ol className="hidden flex-col lg:flex" aria-label="Professional wings">
        {wings.map((w) => {
          const on = active?.id === w.id;
          return (
            <li key={w.id}>
              <Link
                href="/about#wings"
                {...handlers(w)}
                className={cn(
                  'group relative flex items-center gap-4 overflow-hidden border-b border-mist/[0.08] py-3.5 pl-3 pr-2 transition-all duration-500',
                  on ? 'pl-5' : 'hover:pl-5'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0 left-0 w-full origin-left transition-transform duration-500 ease-out',
                    on ? 'scale-x-100' : 'scale-x-0'
                  )}
                  style={{
                    background: `linear-gradient(90deg, color-mix(in srgb, ${w.color} 24%, transparent), transparent 80%)`,
                  }}
                />
                <span
                  className="relative font-mono text-[12px] tabular-nums"
                  style={{ color: w.color }}
                >
                  {String(w.number).padStart(2, '0')}
                </span>
                <span className="relative flex-1 truncate font-display text-[19px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                  {w.name}
                </span>
                <ArrowUpRight
                  className={cn(
                    'relative h-4 w-4 shrink-0 transition-all duration-300',
                    on ? 'rotate-45 text-gold opacity-100' : 'text-[var(--muted)] opacity-0'
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ol>

      {/* Orbit (tablet and up) */}
      <div
        className={cn(
          'relative mx-auto hidden aspect-square w-full max-w-[640px] md:block',
          active && 'orbit-paused'
        )}
      >
        <span aria-hidden className="absolute inset-[6%] rounded-full border border-mist/[0.08]" />
        <span
          aria-hidden
          className="absolute inset-[20%] rounded-full border border-dashed border-mist/[0.12]"
        />
        <span
          aria-hidden
          className="absolute inset-[30%] rounded-full blur-3xl transition-colors duration-700"
          style={{
            background: active
              ? `color-mix(in srgb, ${active.color} 35%, transparent)`
              : 'rgb(var(--lime-rgb) / 0.18)',
          }}
        />

        {/* Centre */}
        <div className="absolute inset-[26%] z-10 grid place-items-center rounded-full border border-mist/[0.12] bg-bg/85 p-6 text-center shadow-[0_0_80px_-20px_rgb(var(--gold-rgb)/0.45)] backdrop-blur-md">
          {active ? (
            <div key={active.id} className="reveal is-in flex flex-col items-center gap-2">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.14em]"
                style={{ color: active.color }}
              >
                Wing {String(active.number).padStart(2, '0')}
              </span>
              <span className="font-display text-[clamp(18px,2.2vw,26px)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--fg)]">
                {active.name}
              </span>
              <span className="line-clamp-2 text-[12px] text-[var(--muted)]">{active.tags}</span>
              <ul className="mt-1 flex flex-wrap justify-center gap-1.5">
                {active.activities.slice(0, 3).map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-mist/[0.14] px-2.5 py-1 text-[11px] text-[var(--fg)]"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="font-display text-[clamp(72px,9vw,112px)] font-semibold leading-[0.9] tracking-[-0.06em] text-white [text-shadow:0_0_40px_rgb(var(--gold-rgb)/0.55),0_0_2px_rgb(var(--white-rgb)/0.6)]">
                {n}
              </span>
              <span className="mt-2 font-display text-[20px] font-medium tracking-[-0.03em] text-[var(--fg)]">
                wings,{' '}
                <em className="font-serif font-normal italic text-gold-gradient">one community</em>
              </span>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-gold-soft">
                <span className="live-dot !bg-gold" aria-hidden /> Hover a wing
              </span>
            </div>
          )}
        </div>

        {/* Orbiting wings (mirrors the list; keyboard users use the list) */}
        <ul className="orbit-ring absolute inset-0" aria-hidden>
          {wings.map((w, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const isActive = active?.id === w.id;
            return (
              <li
                key={w.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${50 + Math.cos(angle) * 44}%`,
                  top: `${50 + Math.sin(angle) * 44}%`,
                }}
              >
                <div className="orbit-node">
                  <Link
                    href="/about#wings"
                    tabIndex={-1}
                    {...handlers(w)}
                    className={cn(
                      'grid h-14 w-14 place-items-center rounded-full border-2 font-mono text-[13px] font-semibold text-white transition duration-300',
                      isActive ? 'scale-125 border-white/80' : 'border-bg hover:scale-110'
                    )}
                    style={{
                      background: w.color,
                      boxShadow: isActive
                        ? `0 0 0 6px color-mix(in srgb, ${w.color} 30%, transparent), 0 0 40px ${w.color}`
                        : `0 0 22px -4px ${w.color}`,
                    }}
                    title={w.name}
                  >
                    {String(w.number).padStart(2, '0')}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Mobile grid */}
      <ul className="grid grid-cols-2 gap-2.5 md:hidden">
        {wings.map((w) => (
          <li key={w.id}>
            <Link
              href="/about#wings"
              className="flex h-full flex-col gap-3 rounded-[20px] border border-mist/[0.1] p-4"
              style={{
                background: `linear-gradient(160deg, color-mix(in srgb, ${w.color} 26%, transparent), transparent 70%), var(--surface-lo)`,
              }}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-semibold text-white"
                style={{ background: w.color }}
              >
                {String(w.number).padStart(2, '0')}
              </span>
              <span className="font-display text-[16px] font-medium leading-tight tracking-[-0.02em] text-[var(--fg)]">
                {w.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
