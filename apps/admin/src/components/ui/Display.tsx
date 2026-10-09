/**
 * Presentational admin building blocks (no hooks — usable from server and client components).
 * Colours come exclusively from theme tokens.
 */
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@ascend/ui';
import {
  MEMBER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  REGISTRATION_STATUS_LABEL,
} from '../../lib/format';

/* ------------------------------------------------------------------------------------------ */

export function PageHeader({
  eyebrow,
  title,
  accent,
  description,
  actions,
  backHref,
  backLabel = 'Back',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  accent?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex w-fit items-center gap-1.5 text-[13px] text-[var(--muted)] transition hover:text-[var(--fg)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            {backLabel}
          </Link>
        )}
        {eyebrow && (
          <span className="inline-flex w-fit items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-brand-200">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_var(--gold)]" />
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.02] tracking-[-0.035em] text-[var(--fg)] text-balance break-words">
          {title}
          {accent && (
            <>
              {' '}
              <em className="font-serif font-normal italic text-gold-gradient pr-1">{accent}</em>
            </>
          )}
        </h1>
        {description && <p className="max-w-[62ch] text-[14.5px] leading-relaxed text-[var(--muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------------------------------ */

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={cn(
        'relative min-w-0 overflow-hidden rounded-token-lg border border-mist/[0.1] bg-grad-surface shadow-[0_30px_60px_-40px_rgb(var(--black-rgb)/0.8)]',
        className
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist/[0.08] px-5 py-4 md:px-6">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[17px] font-medium tracking-[-0.01em] text-[var(--fg)]">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-[var(--muted)]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(padded && 'p-5 md:p-6')}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */

export type Tone = 'blue' | 'gold' | 'ok' | 'warn' | 'bad' | 'mute';

const toneText: Record<Tone, string> = {
  blue: 'text-brand-200',
  gold: 'text-gold',
  ok: 'text-ok',
  warn: 'text-warn',
  bad: 'text-bad',
  mute: 'text-[var(--muted)]',
};

const toneChip: Record<Tone, string> = {
  blue: 'bg-brand-500/15 text-brand-200 border-brand-300/25',
  gold: 'bg-gold/10 text-gold-soft border-gold/30',
  ok: 'bg-ok/10 text-ok border-ok/25',
  warn: 'bg-warn/10 text-warn border-warn/25',
  bad: 'bg-bad/10 text-bad border-bad/25',
  mute: 'bg-mist/[0.06] text-[var(--muted)] border-mist/[0.12]',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <div
      className={cn(
        'group relative h-full min-w-0 overflow-hidden rounded-token-lg border border-mist/[0.1] bg-grad-surface p-5 transition',
        href && 'hover:border-brand-300/40 hover:-translate-y-0.5'
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-40',
          tone === 'gold' ? 'bg-gold/30' : tone === 'ok' ? 'bg-ok/20' : tone === 'warn' ? 'bg-warn/20' : tone === 'bad' ? 'bg-bad/20' : 'bg-brand-500/40'
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">{label}</span>
        {icon && (
          <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl border [&_svg]:h-4 [&_svg]:w-4', toneChip[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div
        className={cn(
          'relative mt-4 font-display text-[clamp(30px,3.4vw,42px)] font-medium leading-none tracking-[-0.04em] tabular-nums break-all',
          tone === 'gold' ? 'text-gold-gradient' : 'text-[var(--fg)]'
        )}
      >
        {value}
      </div>
      {hint && <div className={cn('relative mt-2 text-[12.5px]', toneText[tone === 'blue' ? 'mute' : tone])}>{hint}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-token-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ------------------------------------------------------------------------------------------ */

export function Chip({ tone = 'mute', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.06em]',
        toneChip[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const paymentTone: Record<string, Tone> = {
  paid: 'ok',
  pending: 'warn',
  failed: 'bad',
  refunded: 'gold',
  not_required: 'mute',
};
const registrationTone: Record<string, Tone> = { confirmed: 'ok', pending_payment: 'warn', cancelled: 'bad' };
const memberTone: Record<string, Tone> = { pending: 'warn', approved: 'ok', rejected: 'bad' };

export function PaymentChip({ status }: { status: string }) {
  return <Chip tone={paymentTone[status] ?? 'mute'}>{PAYMENT_STATUS_LABEL[status] ?? status}</Chip>;
}
export function RegistrationChip({ status }: { status: string }) {
  return <Chip tone={registrationTone[status] ?? 'mute'}>{REGISTRATION_STATUS_LABEL[status] ?? status}</Chip>;
}
export function MemberChip({ status }: { status: string }) {
  return <Chip tone={memberTone[status] ?? 'mute'}>{MEMBER_STATUS_LABEL[status] ?? status}</Chip>;
}
export function PublishChip({ published }: { published: boolean }) {
  return <Chip tone={published ? 'ok' : 'mute'}>{published ? 'Live' : 'Draft'}</Chip>;
}

/* ------------------------------------------------------------------------------------------ */

export function SeatBar({ taken, total, compact }: { taken: number; total: number; compact?: boolean }) {
  const pct = total > 0 ? Math.min(100, Math.round((taken / total) * 100)) : 0;
  const tone = pct >= 90 ? 'bg-bad' : pct >= 70 ? 'bg-warn' : 'bg-grad-primary';
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {!compact && (
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="text-[var(--muted)]">
            <b className="font-semibold text-[var(--fg)] tabular-nums">{taken}</b> / {total} seats
          </span>
          <span className="font-mono tabular-nums text-[var(--muted)]">{pct}%</span>
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-mist/[0.08]"
        role="meter"
        aria-label="Seats filled"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(taken, total)}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-700', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */

/** Horizontally scrollable table wrapper with consistent styling. */
export function DataTable({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="-mx-5 overflow-x-auto md:-mx-6" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full min-w-[720px] border-collapse text-left text-[13.5px] [&_td]:border-t [&_td]:border-mist/[0.07] [&_td]:px-5 [&_td]:py-3.5 [&_td]:align-middle md:[&_td]:px-6 [&_th]:whitespace-nowrap [&_th]:px-5 [&_th]:pb-3 [&_th]:font-mono [&_th]:text-[10.5px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.1em] [&_th]:text-[var(--muted)] md:[&_th]:px-6 [&_tbody_tr]:transition-colors hover:[&_tbody_tr]:bg-mist/[0.025]">
        {children}
      </table>
    </div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="!py-12 text-center text-[14px] text-[var(--muted)]">
        {children}
      </td>
    </tr>
  );
}
