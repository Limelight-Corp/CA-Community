'use client';

import React, { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@ascend/ui';

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/* ------------------------------------------------------------------------------------------ */
/* ScrollHighlight — words light up one by one as the paragraph scrolls through the viewport  */
/* ------------------------------------------------------------------------------------------ */

export function ScrollHighlight({
  text,
  highlight = [],
  className,
}: {
  text: string;
  highlight?: string[];
  className?: string;
}) {
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z-]/g, '');
  const keys = new Set(highlight.map(norm));
  const ref = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(1);
  const words = text.split(' ');

  useEffect(() => {
    if (reducedMotion()) return;
    setProgress(0);
    let raf = 0;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top reaches 85% of the viewport, 1 when the bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const p = (start - r.top) / (start - end + r.height);
      setProgress(Math.min(1, Math.max(0, p)));
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

  const lit = progress * words.length;
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => {
          const o = Math.min(1, Math.max(0.16, lit - i + 0.5));
          return (
            <span
              key={i}
              className="transition-[opacity,color] duration-300"
              style={{
                opacity: o,
                color: o > 0.95 && keys.has(norm(w)) ? 'var(--gold)' : undefined,
              }}
            >
              {w}{' '}
            </span>
          );
        })}
      </span>
    </p>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* FlipCard — 3D flip on hover (fine pointers) or tap                                         */
/* ------------------------------------------------------------------------------------------ */

export function FlipCard({
  front,
  back,
  label,
  className,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  /** Accessible name for the toggle, e.g. the card title. */
  label: string;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={cn('flip', className)} data-flipped={flipped ? 'true' : 'false'}>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={`${label}: ${flipped ? 'show title' : 'show details'}`}
        className="flip-inner block h-full w-full rounded-[inherit] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        <span className="flip-face flip-front block overflow-hidden">
          {front}
          <span
            className="absolute bottom-5 right-5 grid h-9 w-9 place-items-center rounded-full border border-mist/[0.16] text-[var(--muted)]"
            aria-hidden
          >
            <RotateCw className="h-4 w-4" />
          </span>
        </span>
        <span className="flip-face flip-back block overflow-hidden">{back}</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* InView — adds a class once the element scrolls into view (drives CSS-only reveals)         */
/* ------------------------------------------------------------------------------------------ */

export function InView({
  children,
  className,
  inClass = 'tree-in',
}: {
  children: React.ReactNode;
  className?: string;
  inClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
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
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn(className, inView && inClass)}>
      {children}
    </div>
  );
}
