'use client';

/**
 * Presentation helpers used across the site.
 *
 * The site is deliberately calm: no pointer-driven tilt, glow, magnetic drift, cursor spotlight
 * or rotating words. These components keep their names and props (they are used on many pages)
 * but render plain, static markup. Cards get a quiet hover shadow from `.calm-card` (tokens.css).
 */
import React from 'react';
import { cn } from '@ascend/ui';

/** Shows the first word only (the words used to rotate). */
export function RotatingWord({
  words,
  className,
  wordClassName,
}: {
  words: string[];
  interval?: number;
  className?: string;
  wordClassName?: string;
}) {
  return (
    <span className={className}>
      <span className={wordClassName}>{words[0]}</span>
    </span>
  );
}

/** Plain wrapper (the cursor spotlight was removed). */
export function Spotlight({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section';
}) {
  return React.createElement(Tag, { className }, children);
}

/** Plain wrapper (the card spotlight was removed). */
export function SpotlightGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/** Plain wrapper (the magnetic drift was removed). */
export function Magnetic({
  children,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  return <span className={cn('inline-block', className)}>{children}</span>;
}

/** Plain wrapper (the 3D tilt was removed). */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string; max?: number }) {
  return <div className={className}>{children}</div>;
}

/** Removed: no scroll progress bar. */
export function ScrollProgress() {
  return null;
}

/** Card with a quiet hover shadow (the tilt and glow were removed). */
export function FxCard({
  children,
  className,
  as: Tag = 'div',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  as?: 'div' | 'li' | 'article';
  style?: React.CSSProperties;
}) {
  return React.createElement(Tag, { className: cn('calm-card', className), style }, children);
}
