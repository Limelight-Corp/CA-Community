'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../utils';

/* ------------------------------------------------------------------------------------------ */
/* Reveal — fades/slides children in when they enter the viewport                             */
/* ------------------------------------------------------------------------------------------ */

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
}

export const Reveal: React.FC<RevealProps> = ({ delay = 0, as: Tag = 'div', className, style, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return React.createElement(Tag, {
    ref,
    className: cn('reveal', inView && 'is-in', className),
    style: { ...style, ['--reveal-delay' as string]: `${delay}ms` },
    ...props,
  });
};

/* ------------------------------------------------------------------------------------------ */
/* Marquee — infinite horizontal ticker (content is duplicated for a seamless loop)           */
/* ------------------------------------------------------------------------------------------ */

export interface MarqueeProps {
  children: React.ReactNode;
  duration?: number;
  gap?: string;
  reverse?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({ children, duration = 40, gap = '3rem', reverse, className, ariaLabel }) => (
  <div
    className={cn('marquee', className)}
    data-reverse={reverse ? 'true' : undefined}
    style={{ ['--marquee-duration' as string]: `${duration}s`, ['--marquee-gap' as string]: gap }}
    role={ariaLabel ? 'region' : undefined}
    aria-label={ariaLabel}
  >
    <div className="marquee__track">{children}</div>
    <div className="marquee__track" aria-hidden>
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------------------------------------ */
/* Countdown — days/hours/minutes/seconds to a target date                                    */
/* ------------------------------------------------------------------------------------------ */

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

export interface CountdownProps {
  /** ISO date, e.g. "2027-01-01T00:00:00+05:30". */
  to: string;
  className?: string;
}

export const Countdown: React.FC<CountdownProps> = ({ to, className }) => {
  const target = new Date(to).getTime();
  const [parts, setParts] = useState<ReturnType<typeof diff> | null>(null);

  useEffect(() => {
    setParts(diff(target));
    const t = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const units: [keyof ReturnType<typeof diff>, string][] = [
    ['days', 'Days'],
    ['hours', 'Hrs'],
    ['minutes', 'Min'],
    ['seconds', 'Sec'],
  ];

  return (
    <div className={cn('flex items-stretch gap-2', className)} role="timer" aria-live="off">
      {units.map(([key, label]) => (
        <div
          key={key}
          className="glass-panel flex min-w-[64px] flex-col items-center rounded-2xl px-3 py-2.5"
        >
          <span className="font-display text-[28px] font-medium leading-none tabular-nums text-[var(--fg)]">
            {parts ? String(parts[key]).padStart(2, '0') : '--'}
          </span>
          <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* CountUp — animates a number when it scrolls into view                                      */
/* ------------------------------------------------------------------------------------------ */

export const CountUp: React.FC<{ value: number; duration?: number; suffix?: string; className?: string }> = ({
  value,
  duration = 1600,
  suffix = '',
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      setN(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        setN(Math.round(value * (1 - Math.pow(1 - p, 4))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {n.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};
