'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@ascend/ui';

/* ------------------------------------------------------------------------------------------ */
/* ScrollHighlight — a statement paragraph with a few key words in the brand colour           */
/* (static: the words no longer light up one by one while scrolling)                          */
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
  return (
    <p className={className}>
      {text.split(' ').map((w, i) => (
        <React.Fragment key={i}>
          {keys.has(norm(w)) ? <span className="text-brand-500">{w}</span> : w}{' '}
        </React.Fragment>
      ))}
    </p>
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
