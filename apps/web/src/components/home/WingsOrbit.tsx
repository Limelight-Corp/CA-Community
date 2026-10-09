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
 * The ten wings orbiting the community. Hovering or focusing a wing pauses the orbit and
 * shows its focus areas and first proposed activities in the centre. On small screens the
 * orbit becomes a compact grid.
 */
export function WingsOrbit({ wings }: { wings: OrbitWing[] }) {
  const [active, setActive] = useState<OrbitWing | null>(null);
  const n = wings.length;

  return (
    <div className="relative">
      {/* Desktop / tablet orbit */}
      <div
        className={cn(
          'relative mx-auto hidden aspect-square w-full max-w-[720px] md:block',
          active && 'orbit-paused'
        )}
      >
        {/* Rings */}
        <span aria-hidden className="absolute inset-[6%] rounded-full border border-mist/[0.08]" />
        <span
          aria-hidden
          className="absolute inset-[22%] rounded-full border border-dashed border-mist/[0.1]"
        />
        <span aria-hidden className="absolute inset-[34%] rounded-full bg-brand-500/10 blur-2xl" />

        {/* Centre */}
        <div className="absolute inset-[27%] z-10 grid place-items-center rounded-full border border-mist/[0.1] bg-bg/80 p-6 text-center backdrop-blur-md">
          {active ? (
            <div key={active.id} className="reveal is-in flex flex-col items-center gap-2">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.14em]"
                style={{ color: active.color }}
              >
                Wing {String(active.number).padStart(2, '0')}
              </span>
              <span className="font-display text-[clamp(20px,2.4vw,28px)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--fg)]">
                {active.name}
              </span>
              <span className="line-clamp-2 text-[12.5px] text-[var(--muted)]">{active.tags}</span>
              <ul className="mt-1 flex flex-wrap justify-center gap-1.5">
                {active.activities.slice(0, 3).map((a) => (
                  <li
                    key={a}
                    className="rounded-full border border-mist/[0.12] px-2.5 py-1 text-[11px] text-[var(--fg)]"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="font-display text-[88px] font-semibold leading-none tracking-[-0.06em] text-hero-gradient">
                {n}
              </span>
              <span className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">
                wings, one community
              </span>
              <span className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                Hover a wing
              </span>
            </div>
          )}
        </div>

        {/* Orbiting wings */}
        <ul className="orbit-ring absolute inset-0" aria-label="Professional wings">
          {wings.map((w, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const left = 50 + Math.cos(angle) * 45;
            const top = 50 + Math.sin(angle) * 45;
            const isActive = active?.id === w.id;
            return (
              <li
                key={w.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${left}%`, top: `${top}%` }}
              >
                <div className="orbit-node">
                  <Link
                    href="/about#wings"
                    onPointerEnter={() => setActive(w)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(w)}
                    onBlur={() => setActive(null)}
                    className={cn(
                      'group flex items-center gap-2 rounded-full border bg-bg/90 py-1.5 pl-1.5 pr-3.5 backdrop-blur-md transition duration-300',
                      isActive
                        ? 'scale-110 border-transparent shadow-[0_0_40px_-6px_var(--wing)]'
                        : 'border-mist/[0.14] hover:scale-105'
                    )}
                    style={{ ['--wing' as string]: w.color }}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full font-mono text-[11px] font-semibold text-white"
                      style={{ background: w.color }}
                    >
                      {String(w.number).padStart(2, '0')}
                    </span>
                    <span className="max-w-[118px] truncate text-[12px] font-medium text-[var(--fg)]">
                      {w.name}
                    </span>
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

      <div className="mt-10 flex justify-center">
        <Link
          href="/about#wings"
          className="group inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--fg)]"
        >
          <span className="draw-underline">See all 100 proposed activities</span>
          <ArrowUpRight className="h-4 w-4 transition group-hover:rotate-45" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
