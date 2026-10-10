'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
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
import { JourneyArt } from './JourneyArt';

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

/** What each step looks like on this site, and where to do it — in the same order as the steps. */
const STEP_DETAILS: { points: string[]; cta: string; href: string }[] = [
  { points: ['Meet the wings and their focus areas', 'See upcoming events and speakers', 'Read news and free resources'], cta: 'About the community', href: '/about' },
  { points: ['Free account with your email', 'Verify your email in one click', 'Track your bookings in one dashboard'], cta: 'Create account', href: '/login?mode=register' },
  { points: ['Pick the plan that fits you', 'Pay once your application is approved', 'Membership runs for 12 months'], cta: 'See membership plans', href: '/join' },
  { points: ['Add your photo, designation and bio', 'Share your city, firm and practice area', 'Opt in to the members directory'], cta: 'Open my profile', href: '/dashboard?tab=profile' },
  { points: ['Follow the wings you care about', 'Join city and young CA communities', 'Explore each wing’s activities'], cta: 'Browse the wings', href: '/wings' },
  { points: ['Webinars, workshops and meet-ups', 'Member pricing on paid events', 'Entry pass, reminders and receipts'], cta: 'See upcoming events', href: '/events' },
  { points: ['Find members in the directory', 'Discover jobs and articleship roles', 'Meet peers at every event'], cta: 'Open the directory', href: '/directory' },
  { points: ['Mentor students and young CAs', 'Share knowledge at sessions', 'Volunteer at community events'], cta: 'Become a mentor', href: '/mentorship' },
  { points: ['Lead city networking and events', 'Champion young CA programmes', 'Drive wing and community initiatives'], cta: 'How we are organised', href: '/about' },
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
            const extra = STEP_DETAILS[i];
            return (
              <li
                key={s.title}
                className={cn(
                  'group/step relative flex w-[min(80vw,300px)] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] border transition-[opacity,filter,transform,box-shadow] duration-500 lg:w-[320px]',
                  last ? 'border-transparent bg-grad-gold text-brand-950' : 'border-mist/[0.1] bg-grad-surface',
                  pinned && !lit && 'jr-idle scale-[0.96] opacity-40 saturate-50',
                  pinned && i === active && !last && 'border-gold/40 shadow-[0_30px_70px_-35px_rgb(var(--gold-rgb)/0.6)]'
                )}
              >
                {/* Illustration */}
                <div
                  className={cn(
                    'relative h-32 overflow-hidden border-b md:h-36',
                    last ? 'border-brand-950/15 bg-brand-950' : 'border-mist/[0.08] bg-[radial-gradient(80%_90%_at_50%_0%,rgb(var(--lime-rgb)/0.16),transparent_70%)]'
                  )}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgb(var(--mist-rgb)/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--mist-rgb)/0.05)_1px,transparent_1px)] [background-size:16px_16px]"
                  />
                  <JourneyArt index={i} className="relative h-full w-full transition-transform duration-700 group-hover/step:scale-[1.04]" />
                  <span
                    className={cn(
                      'absolute left-3 top-3 rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em] backdrop-blur-md',
                      last ? 'border-gold/40 bg-gold/15 text-gold' : 'border-mist/[0.12] bg-bg/50 text-gold'
                    )}
                  >
                    Step {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={cn(
                      'absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl transition-transform duration-700',
                      last ? 'bg-gold text-brand-950' : 'bg-brand-500/20 text-brand-200',
                      lit && pinned && 'rotate-[-8deg] scale-110'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3
                    className={cn(
                      'font-display text-[23px] font-medium leading-[1.05] tracking-[-0.035em]',
                      last ? 'text-brand-950' : 'text-[var(--fg)]'
                    )}
                  >
                    {s.title}
                  </h3>
                  <p className={cn('mt-1.5 text-[14px] leading-snug', last ? 'text-brand-950/75' : 'text-[var(--muted)]')}>{s.text}</p>
                  {extra && (
                    <>
                      <ul className="mt-3.5 flex flex-col gap-1.5">
                        {extra.points.map((pt) => (
                          <li key={pt} className={cn('flex items-start gap-2 text-[13px] leading-snug', last ? 'text-brand-950/85' : 'text-[var(--fg-soft)]')}>
                            <Check className={cn('mt-[2px] h-3.5 w-3.5 shrink-0', last ? 'text-brand-950' : 'text-gold')} aria-hidden />
                            {pt}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={extra.href}
                        className={cn(
                          'mt-auto inline-flex items-center gap-1.5 self-start pt-4 text-[13.5px] font-semibold transition',
                          last ? 'text-brand-950 hover:opacity-80' : 'text-brand-200 hover:text-[var(--fg)]'
                        )}
                      >
                        {extra.cta}
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/step:rotate-45" aria-hidden />
                      </Link>
                    </>
                  )}
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
