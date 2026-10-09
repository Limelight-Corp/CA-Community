'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
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
 * The nine-step member journey. On every screen size the section pins while vertical
 * scrolling slides the steps horizontally; the scroll length equals the track's overflow so
 * the pace feels natural. With reduced motion it falls back to a swipeable row.
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
  const [distance, setDistance] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const apply = () => setPinned(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!pinned) return;
    let raf = 0;
    const measure = () => {
      const t = track.current;
      if (t) setDistance(Math.max(0, t.scrollWidth - t.clientWidth));
    };
    const update = () => {
      const o = outer.current;
      const t = track.current;
      if (!o || !t) return;
      const total = o.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -o.getBoundingClientRect().top / total)) : 0;
      t.style.transform = `translate3d(${(-p * (t.scrollWidth - t.clientWidth)).toFixed(1)}px, 0, 0)`;
      setProgress(p);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (track.current) track.current.style.transform = '';
    };
  }, [pinned]);

  const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));

  return (
    <div
      ref={outer}
      className={cn('relative', !pinned && 'py-24 md:py-32')}
      // Pinned: one viewport plus the horizontal overflow, so 1px of vertical scroll ≈ 1px sideways.
      style={pinned && distance ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div
        className={cn(
          pinned &&
            'sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pt-[72px] md:pt-0'
        )}
      >
        <div className="mx-auto w-full max-w-[1400px] px-5 md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            {heading}
            {pinned && (
              <div className="flex items-center gap-3 md:gap-4" aria-hidden>
                <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.05em] text-[var(--fg)] tabular-nums md:text-[56px]">
                  {String(active + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[12px] text-[var(--muted)]">
                  / {String(steps.length).padStart(2, '0')}
                </span>
                <span className="relative h-[3px] w-28 overflow-hidden rounded-full bg-mist/[0.1] md:w-40">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-grad-gold"
                    style={{ width: `${Math.max(4, progress * 100)}%` }}
                  />
                </span>
                <span
                  className={cn(
                    'ml-1 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--muted)] transition-opacity duration-500',
                    progress > 0.06 && 'opacity-0'
                  )}
                >
                  Scroll <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                </span>
              </div>
            )}
          </div>
        </div>

        <ol
          ref={track}
          className={cn(
            'mt-8 flex gap-4 px-5 will-change-transform md:mt-12 md:gap-5 md:px-8',
            !pinned && 'snap-x snap-mandatory overflow-x-auto pb-6 [scrollbar-width:thin]',
            pinned && 'md:pl-[max(2rem,calc((100vw-1400px)/2+2rem))]'
          )}
        >
          {steps.map((s, i) => {
            const last = i === steps.length - 1;
            const lit = pinned ? i <= active : true;
            const Icon = STEP_ICONS[i] ?? Compass;
            return (
              <li
                key={s.title}
                className={cn(
                  'relative flex h-[min(50svh,420px)] w-[min(80vw,340px)] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[28px] border p-6 transition-[opacity,filter,transform] duration-500 md:rounded-[32px] md:p-7 lg:h-[min(58vh,540px)] lg:w-[min(30vw,400px)]',
                  last
                    ? 'border-transparent bg-grad-gold text-brand-950'
                    : 'border-mist/[0.1] bg-grad-surface',
                  pinned && !lit && 'scale-[0.96] opacity-40 saturate-50',
                  pinned &&
                    i === active &&
                    !last &&
                    'border-gold/40 shadow-[0_30px_70px_-35px_rgb(var(--gold-rgb)/0.6)]'
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -bottom-10 -right-3 font-display text-[160px] font-semibold leading-none tracking-[-0.08em] md:text-[200px]',
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
                  <span
                    className={cn(
                      'grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-700 md:h-14 md:w-14',
                      last ? 'bg-brand-950 text-gold' : 'bg-brand-500/15 text-brand-200',
                      lit && pinned && 'rotate-[-8deg] scale-110'
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                </div>
                <div className="relative">
                  <h3
                    className={cn(
                      'font-display text-[30px] font-medium leading-[1] tracking-[-0.045em] md:text-[34px]',
                      last ? 'text-brand-950' : 'text-[var(--fg)]'
                    )}
                  >
                    {s.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-3 max-w-[30ch] text-[15px] leading-relaxed',
                      last ? 'text-brand-950/75' : 'text-[var(--muted)]'
                    )}
                  >
                    {s.text}
                  </p>
                </div>
              </li>
            );
          })}
          {pinned && <li aria-hidden className="w-[6vw] shrink-0" />}
        </ol>
      </div>
    </div>
  );
}
