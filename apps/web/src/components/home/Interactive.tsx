'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@ascend/ui';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function finePointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
  );
}

/* ------------------------------------------------------------------------------------------ */
/* RotatingWord — cycles words in place; width is reserved for the longest word               */
/* ------------------------------------------------------------------------------------------ */

export function RotatingWord({
  words,
  interval = 2400,
  className,
  wordClassName,
}: {
  words: string[];
  interval?: number;
  className?: string;
  /** Applied to every word. Gradient text must go here, not on a parent: background-clip
   *  on a parent paints the hidden words too. */
  wordClassName?: string;
}) {
  const [{ i, prev }, setTick] = useState<{ i: number; prev: number | null }>({ i: 0, prev: null });
  const [width, setWidth] = useState<number | null>(null);
  const spans = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (words.length < 2 || prefersReducedMotion()) return;
    const t = setInterval(
      () => setTick((s) => ({ i: (s.i + 1) % words.length, prev: s.i })),
      interval
    );
    return () => clearInterval(t);
  }, [words.length, interval]);

  // The container animates to the active word's width, so following text slides instead of
  // leaving a gap sized for the longest word.
  useEffect(() => {
    const measure = () => {
      const el = spans.current[i];
      if (el) setWidth(el.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [i]);

  return (
    <>
      {/* Screen readers get a stable sentence, not a ticking word. */}
      <span className="sr-only">{words[0]}</span>
      <span
        className={cn('word-swap', className)}
        style={width ? { width: `calc(${width}px + 0.12em)` } : undefined}
        aria-hidden
      >
        {words.map((w, n) => (
          <span
            key={w}
            ref={(el) => {
              spans.current[n] = el;
            }}
            data-state={n === i ? 'active' : n === prev ? 'exit' : 'idle'}
            className={wordClassName}
          >
            {w}
          </span>
        ))}
      </span>
    </>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Spotlight — tracks the pointer and exposes --mx / --my to CSS                              */
/* ------------------------------------------------------------------------------------------ */

export function Spotlight({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section';
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer()) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
        el.style.setProperty('--spot-opacity', '1');
      });
    };
    const onLeave = () => el.style.setProperty('--spot-opacity', '0');
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return React.createElement(Tag, { ref, className: cn('spotlight', className) }, children);
}

/** Card-level spotlight: a soft gold glow follows the pointer across all `.spotlight-card` children. */
export function SpotlightGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !finePointer()) return;
    const onMove = (e: PointerEvent) => {
      root.querySelectorAll<HTMLElement>('.spotlight-card').forEach((card) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    root.addEventListener('pointermove', onMove);
    return () => root.removeEventListener('pointermove', onMove);
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Magnetic — child drifts toward the pointer                                                  */
/* ------------------------------------------------------------------------------------------ */

export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReducedMotion()) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [strength]);
  return (
    <span
      ref={ref}
      className={cn('inline-block transition-transform duration-300 ease-out', className)}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* TiltCard — 3D tilt following the pointer                                                    */
/* ------------------------------------------------------------------------------------------ */

export function TiltCard({
  children,
  className,
  max = 8,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer() || prefersReducedMotion()) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    };
    const onLeave = () => {
      el.style.transform = '';
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);
  return (
    <div
      ref={ref}
      className={cn(
        'transition-transform duration-300 ease-out [transform-style:preserve-3d]',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* ScrollProgress — thin gold bar at the top of the viewport                                  */
/* ------------------------------------------------------------------------------------------ */

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty('--progress', String(max > 0 ? window.scrollY / max : 0));
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
    };
  }, []);
  return <div ref={ref} className="scroll-progress" aria-hidden />;
}

/* ------------------------------------------------------------------------------------------ */
/* FxCard — pointer tilt + gold glow + lift (styles: .fx-card in tokens.css)                  */
/* ------------------------------------------------------------------------------------------ */

export function FxCard({
  children,
  className,
  max = 7,
  as: Tag = 'div',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  as?: 'div' | 'li' | 'article';
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    if (!finePointer()) {
      // Touch screens: the card tilts gently and the glow sweeps across it as it scrolls
      // through the viewport, so mobile gets motion without hover.
      if (reduce || typeof IntersectionObserver === 'undefined') return;
      let raf = 0;
      let visible = false;
      const update = () => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(-1, (r.top + r.height / 2 - vh / 2) / (vh / 2)));
        el.style.setProperty('--rx', `${(p * max * 0.6).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${r.width * (0.5 - p * 0.4)}px`);
        el.style.setProperty('--my', `${r.height * (0.5 + p * 0.5)}px`);
        el.classList.toggle('fx-live', Math.abs(p) < 0.55);
      };
      const onScroll = () => {
        if (!visible) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
      };
      const io = new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) onScroll();
      });
      io.observe(el);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener('scroll', onScroll);
      };
    }
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.style.setProperty('--mx', `${x}px`);
        el.style.setProperty('--my', `${y}px`);
        if (!reduce) {
          el.style.setProperty('--rx', `${(-(y / r.height - 0.5) * max).toFixed(2)}deg`);
          el.style.setProperty('--ry', `${((x / r.width - 0.5) * max).toFixed(2)}deg`);
        }
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [max]);
  return React.createElement(Tag, { ref, className: cn('fx-card', className), style }, children);
}
