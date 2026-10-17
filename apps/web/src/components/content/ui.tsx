import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AccentText, Container, Kicker, cn } from '@ascend/ui';

/* ------------------------------------------------------------------------------------------ */
/* PageHero — oversized display heading on an aurora/grain backdrop (one H1 per page)          */
/* ------------------------------------------------------------------------------------------ */

export interface PageHeroProps {
  eyebrow: React.ReactNode;
  eyebrowTone?: 'blue' | 'gold';
  title: React.ReactNode;
  accent?: React.ReactNode;
  accentTone?: 'blue' | 'gold' | 'hero';
  lead?: React.ReactNode;
  /** Giant outlined word drifting behind the heading. */
  ghost?: string;
  children?: React.ReactNode;
  className?: string;
  contentWidth?: string;
  leadWidth?: string;
}

export function PageHero({
  eyebrow,
  eyebrowTone = 'gold',
  title,
  accent,
  accentTone = 'gold',
  lead,
  ghost,
  children,
  className,
  contentWidth = 'max-w-5xl xl:max-w-6xl',
  leadWidth = 'max-w-3xl xl:max-w-4xl',
}: PageHeroProps) {
  return (
    <section className={cn('grain relative overflow-hidden border-b border-[var(--line)] pb-16 pt-14 md:pb-24 md:pt-24', className)}>
      <div className="aurora" aria-hidden>
        <i />
      </div>
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      {ghost && (
        <span
          aria-hidden
          className="text-outline pointer-events-none absolute -bottom-[0.18em] right-[-0.04em] select-none font-display text-[clamp(110px,22vw,340px)] font-semibold leading-none tracking-[-0.06em] opacity-40"
        >
          {ghost}
        </span>
      )}
      <Container size="wide" className="relative z-10">
        <div className={cn('flex flex-col gap-6', contentWidth)}>
          <Kicker tone={eyebrowTone}>{eyebrow}</Kicker>
          <h1 className="font-display text-[clamp(38px,5.4vw,84px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
            {title}
            {accent && (
              <>
                {' '}
                <AccentText tone={accentTone}>{accent}</AccentText>
              </>
            )}
          </h1>
          {lead && (
            <div className={cn('text-[clamp(16px,1.35vw,19px)] leading-relaxed text-[var(--muted)]', leadWidth)}>
              {typeof lead === 'string' ? <p>{lead}</p> : lead}
            </div>
          )}
          {children && <div className={cn('flex flex-col gap-4', leadWidth)}>{children}</div>}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* PillLink — pill CTA with rotating arrow                                                     */
/* ------------------------------------------------------------------------------------------ */

export interface PillLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'gold' | 'ghost';
  external?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function PillLink({ href, children, variant = 'primary', external, className, icon }: PillLinkProps) {
  const classes = cn(
    'group inline-flex h-12 items-center justify-between gap-4 rounded-full pl-5 pr-1.5 text-[14.5px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    variant === 'primary' && 'bg-grad-primary text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] hover:brightness-110',
    variant === 'gold' && 'bg-grad-gold text-[#2A1A0E] hover:brightness-105',
    variant === 'ghost' && 'border border-mist/[0.18] text-[var(--fg)] hover:border-mist/50',
    className
  );
  const bubble = (
    <span
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45',
        variant === 'primary' && 'bg-white/15',
        variant === 'gold' && 'bg-brand-950 text-gold',
        variant === 'ghost' && 'bg-mist/[0.08]'
      )}
    >
      {icon ?? <ArrowUpRight className="h-4 w-4" aria-hidden />}
    </span>
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {bubble}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
      {bubble}
    </Link>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Section wrapper + small chip                                                                */
/* ------------------------------------------------------------------------------------------ */

export function Section({ id, className, children, labelledBy }: { id?: string; className?: string; children: React.ReactNode; labelledBy?: string }) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn('relative scroll-mt-28 py-[clamp(72px,10vw,136px)]', className)}>
      {children}
    </section>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-mist/[0.12] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]', className)}>
      {children}
    </span>
  );
}

/** Class names for filter chips (buttons with aria-pressed). */
export const chipClass = (active: boolean) =>
  cn(
    'shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300',
    active ? 'border-gold/60 bg-gold/10 text-gold-soft' : 'border-mist/[0.12] text-[var(--muted)] hover:border-mist/40 hover:text-[var(--fg)]'
  );

/** Final call-to-action band reused at the bottom of content pages. */
export function CtaBand({
  title,
  accent,
  lead,
  primary,
  secondary,
  align = 'start',
  className,
}: {
  title: string;
  accent?: string;
  lead?: React.ReactNode;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  align?: 'start' | 'center';
  className?: string;
}) {
  const isCentered = align === 'center';
  return (
    <section className={cn('relative py-[clamp(36px,5vw,68px)]', className)}>
      <Container size="wide">
        <div className="grain relative overflow-hidden rounded-[36px] border border-gold/20 bg-grad-surface px-6 pt-10 pb-12 md:px-14 md:pt-12 md:pb-14">
          <div className="aurora opacity-70" aria-hidden>
            <i />
          </div>
          <div
            className={cn(
              'relative z-10 flex flex-col gap-8',
              isCentered
                ? 'mx-auto max-w-[940px] items-center text-center'
                : 'lg:flex-row lg:items-end lg:justify-between'
            )}
          >
            <div
              className={cn(
                'flex flex-col gap-5',
                isCentered ? 'items-center max-w-[880px]' : 'max-w-[28ch]'
              )}
            >
              <h2 className="font-display text-[clamp(44px,7.5vw,96px)] font-medium leading-[0.93] tracking-[-0.05em] text-[var(--fg)] text-balance">
                {title} {accent && <AccentText tone="gold">{accent}</AccentText>}
              </h2>
              {lead && (
                <div
                  className={cn(
                    'text-[clamp(16px,1.2vw,18.5px)] leading-relaxed text-[var(--muted)]',
                    isCentered ? 'max-w-[70ch] mx-auto text-pretty' : 'max-w-[56ch]'
                  )}
                >
                  {lead}
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex flex-col gap-3 sm:flex-row',
                isCentered && 'justify-center pt-1'
              )}
            >
              <PillLink href={primary.href} variant="gold">
                {primary.label}
              </PillLink>
              {secondary && (
                <PillLink href={secondary.href} variant="ghost">
                  {secondary.label}
                </PillLink>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
