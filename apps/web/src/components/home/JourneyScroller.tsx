'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  CalendarDays,
  Compass,
  Crown,
  HandHeart,
  IdCard,
  Network,
  SlidersHorizontal,
  UserPlus,
} from 'lucide-react';
import { cn } from '@ascend/ui';

/** One icon per documented journey step, in order. */
const STEP_ICONS = [
  Compass,
  UserPlus,
  BadgeCheck,
  IdCard,
  SlidersHorizontal,
  CalendarDays,
  Network,
  HandHeart,
  Crown,
];

export interface JourneyStep {
  title: string;
  text: string;
}

/**
 * The nine-step member journey. On wide screens with motion allowed, the section pins while
 * vertical scrolling slides the steps horizontally; otherwise it is a swipeable row.
 */
export function JourneyScroller({
  steps,
  heading,
}: {
  steps: readonly JourneyStep[];
  heading: React.ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const [pinned, setPinned] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const update = () => {
      const o = outer.current;
      const t = track.current;
      if (!o || !t) return;
      const rect = o.getBoundingClientRect();
      const total = o.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      const distance = t.scrollWidth - t.clientWidth;
      t.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
      setProgress(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (track.current) track.current.style.transform = '';
    };
  }, [pinned]);

  const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));

  return (
    <div ref={outer} className={cn('relative', pinned && 'h-[320vh]')}>
      <div
        className={cn(
          pinned && 'sticky top-0 flex h-screen flex-col justify-center overflow-hidden'
        )}
      >
        <div className="mx-auto w-full max-w-[1400px] px-5 md:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            {heading}
            {pinned && (
              <div className="flex items-center gap-4" aria-hidden>
                <span className="font-display text-[56px] font-semibold leading-none tracking-[-0.05em] text-[var(--fg)] tabular-nums">
                  {String(active + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[12px] text-[var(--muted)]">
                  / {String(steps.length).padStart(2, '0')}
                </span>
                <span className="relative h-[3px] w-40 overflow-hidden rounded-full bg-mist/[0.1]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-grad-gold"
                    style={{ width: `${Math.max(4, progress * 100)}%` }}
                  />
                </span>
              </div>
            )}
          </div>
        </div>

        <ol
          ref={track}
          className={cn(
            'mt-12 flex gap-5 px-5 md:px-8 will-change-transform',
            !pinned && 'snap-x snap-mandatory overflow-x-auto pb-6 [scrollbar-width:thin]',
            pinned && 'pl-[max(2rem,calc((100vw-1400px)/2+2rem))]'
          )}
        >
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            const lit = pinned ? i <= active : true;
            return (
              <li
                key={s.title}
                className={cn(
                  'relative flex w-[min(78vw,340px)] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[32px] border p-7 transition-all duration-500 fx-step lg:h-[min(60vh,540px)] lg:w-[min(30vw,400px)]',
                  last
                    ? 'border-transparent bg-grad-gold text-brand-950'
                    : 'border-mist/[0.1] bg-grad-surface',
                  pinned && !lit && 'opacity-40 saturate-50'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -bottom-12 -right-3 font-display text-[200px] font-semibold leading-none tracking-[-0.08em]',
                    last ? 'text-brand-950/10' : 'text-outline opacity-40'
                  )}
                >
                  {i + 1}
                </span>
                <div className="relative flex items-center justify-between">
                  <span
                    className={cn(
                      'font-mono text-[12px] uppercase tracking-[0.14em]',
                      last ? 'text-brand-950/70' : 'text-gold'
                    )}
                  >
                    Step {String(i + 1).padStart(2, '0')}
                  </span>
                  {(() => {
                    const Icon = STEP_ICONS[i] ?? Compass;
                    return (
                      <span
                        className={cn(
                          'grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-700',
                          last ? 'bg-brand-950 text-gold' : 'bg-brand-500/15 text-brand-200',
                          lit && pinned && 'rotate-[-8deg] scale-110'
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </span>
                    );
                  })()}
                </div>
                <div className="relative mt-24 lg:mt-0">
                  <h3
                    className={cn(
                      'font-display text-[34px] font-medium leading-[1] tracking-[-0.045em]',
                      last ? 'text-brand-950' : 'text-[var(--fg)]'
                    )}
                  >
                    {s.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-3 text-[15px] leading-relaxed',
                      last ? 'text-brand-950/75' : 'text-[var(--muted)]'
                    )}
                  >
                    {s.text}
                  </p>
                </div>
              </li>
            );
          })}
          {pinned && <li aria-hidden className="w-[20vw] shrink-0" />}
        </ol>
      </div>
    </div>
  );
}
