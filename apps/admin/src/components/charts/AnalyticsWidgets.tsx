'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Info,
  Mail,
  Radio,
  Ticket,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { CountUp, cn } from '@ascend/ui';
import { Sparkline, formatValue, type ValueFormat } from './Charts';

/* ------------------------------------------------------------------------------------------ */
/* KPI tile                                                                                    */
/* ------------------------------------------------------------------------------------------ */

export interface KpiTileProps {
  label: string;
  value: number;
  previous: number;
  format: ValueFormat;
  trend: number[];
  upIsGood: boolean;
  href?: string;
  periodLabel: string;
  hero?: boolean;
}

export function KpiTile({ label, value, previous, format, trend, upIsGood, href, periodLabel, hero }: KpiTileProps) {
  const diff = value - previous;
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : null;
  const good = diff === 0 ? null : diff > 0 === upIsGood;
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('font-mono text-[11px] font-medium uppercase tracking-[0.1em]', hero ? 'text-white/80' : 'text-[var(--muted)]')}>{label}</span>
        {diff !== 0 && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums',
              good ? 'border-ok/30 bg-ok/10 text-ok' : 'border-bad/30 bg-bad/10 text-bad',
              hero && 'border-white/30 bg-white/15 text-white'
            )}
            title={`vs previous ${periodLabel}: ${formatValue(previous, format)}`}
          >
            {diff > 0 ? <ArrowUpRight className="h-3 w-3" aria-hidden /> : <ArrowDownRight className="h-3 w-3" aria-hidden />}
            {pct !== null ? `${Math.abs(pct)}%` : 'new'}
          </span>
        )}
      </div>
      <div className={cn('mt-4 font-display font-semibold leading-none tracking-[-0.04em] tabular-nums', hero ? 'text-[52px] text-white' : 'text-[34px] text-[var(--fg)]')}>
        {format === 'inr' && '₹'}
        <CountUp value={value} />
        {format === 'percent' && '%'}
      </div>
      <p className={cn('mt-2 text-[12px]', hero ? 'text-white/75' : 'text-[var(--muted)]')}>
        {previous > 0 || value > 0 ? `${formatValue(previous, format)} previous ${periodLabel}` : `No activity in the last ${periodLabel}`}
      </p>
      {trend.length > 1 && trend.some((v) => v > 0) && (
        <Sparkline values={trend} color={hero ? 'var(--gold-soft)' : 'var(--series-1)'} className="mt-3" />
      )}
    </>
  );
  const cls = cn(
    'shine group relative flex min-w-0 flex-col overflow-hidden rounded-token-lg border p-5 transition duration-300 hover:-translate-y-0.5',
    hero ? 'border-transparent bg-grad-primary shadow-[0_24px_60px_-30px_rgb(var(--lime-rgb)/0.9)]' : 'border-mist/[0.1] bg-grad-surface'
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Range filter + live refresh (one row, above the charts)                                     */
/* ------------------------------------------------------------------------------------------ */

export function AnalyticsToolbar({
  ranges,
  current,
  basePath = '/analytics',
}: {
  ranges: readonly { key: string; label: string }[];
  current: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const [updated, setUpdated] = useState<string>('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      startTransition(() => router.refresh());
      setUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 20_000);
    return () => clearInterval(t);
  }, [live, router]);

  return (
    <div className="flex flex-wrap items-center gap-3" role="toolbar" aria-label="Analytics filters">
      <div className="flex flex-wrap rounded-full border border-mist/[0.12] bg-bg/40 p-1">
        {ranges.map((r) => (
          <Link
            key={r.key}
            href={`${basePath}?range=${r.key}`}
            scroll={false}
            aria-current={r.key === current ? 'true' : undefined}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition',
              r.key === current ? 'bg-grad-primary text-white shadow-[0_6px_18px_-8px_rgb(var(--lime-rgb)/0.9)]' : 'text-[var(--muted)] hover:text-[var(--fg)]'
            )}
          >
            {r.label}
          </Link>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setLive((v) => !v)}
        aria-pressed={live}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition',
          live ? 'border-ok/40 bg-ok/10 text-ok' : 'border-mist/[0.12] text-[var(--muted)] hover:text-[var(--fg)]'
        )}
      >
        {live ? <span className="live-dot" aria-hidden /> : <Radio className="h-3.5 w-3.5" aria-hidden />}
        {live ? 'Live · auto-refresh' : 'Go live'}
      </button>
      <span className={cn('font-mono text-[11px] text-[var(--muted)] transition-opacity', pending && 'opacity-50')} aria-live="polite">
        {updated && `Updated ${updated}`}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Insights                                                                                    */
/* ------------------------------------------------------------------------------------------ */

const INSIGHT_STYLE = {
  ok: { Icon: CheckCircle2, cls: 'text-ok bg-ok/10 border-ok/25' },
  warn: { Icon: AlertTriangle, cls: 'text-warn bg-warn/10 border-warn/25' },
  bad: { Icon: XCircle, cls: 'text-bad bg-bad/10 border-bad/25' },
  info: { Icon: Info, cls: 'text-brand-200 bg-brand-500/10 border-brand-300/25' },
} as const;

export function InsightList({ items }: { items: { tone: keyof typeof INSIGHT_STYLE; title: string; detail: string; href?: string }[] }) {
  if (!items.length) return <p className="text-[13px] text-[var(--muted)]">All quiet — no insights for this period yet.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it, i) => {
        const { Icon, cls } = INSIGHT_STYLE[it.tone];
        const inner = (
          <>
            <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg border', cls)}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-medium text-[var(--fg)]">{it.title}</span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--muted)]">{it.detail}</span>
            </span>
            {it.href && <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--fg)]" aria-hidden />}
          </>
        );
        return (
          <li key={i} className="reveal is-in" style={{ ['--reveal-delay' as string]: `${i * 60}ms` }}>
            {it.href ? (
              <Link href={it.href} className="group flex items-start gap-3 rounded-xl border border-mist/[0.06] p-3 transition hover:border-mist/[0.18] hover:bg-mist/[0.03]">
                {inner}
              </Link>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-mist/[0.06] p-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Activity feed                                                                               */
/* ------------------------------------------------------------------------------------------ */

const ACTIVITY_ICON = {
  registration: { Icon: Ticket, cls: 'text-brand-200 bg-brand-500/15' },
  payment: { Icon: CreditCard, cls: 'text-ok bg-ok/15' },
  member: { Icon: UserPlus, cls: 'text-gold bg-gold/15' },
  message: { Icon: Mail, cls: 'text-[var(--fg)] bg-mist/[0.08]' },
} as const;

function relative(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function ActivityFeed({ items }: { items: { at: string; kind: keyof typeof ACTIVITY_ICON; title: string; detail: string; href: string }[] }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);
  if (!items.length) return <p className="text-[13px] text-[var(--muted)]">Activity appears here as people register, pay, apply and write in.</p>;
  return (
    <ol className="relative flex flex-col gap-1">
      <span aria-hidden className="absolute bottom-3 left-[15px] top-3 w-px bg-mist/[0.08]" />
      {items.map((it, i) => {
        const { Icon, cls } = ACTIVITY_ICON[it.kind];
        return (
          <li key={`${it.at}-${i}`}>
            <Link href={it.href} className="group relative flex items-start gap-3 rounded-xl p-1.5 transition hover:bg-mist/[0.03]">
              <span className={cn('relative z-10 grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full ring-4 ring-[var(--surface-hi)]', cls)}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block truncate text-[13px] text-[var(--fg)]">{it.title}</span>
                <span className="block truncate text-[12px] text-[var(--muted)]">{it.detail}</span>
              </span>
              <time dateTime={it.at} className="shrink-0 pt-1 font-mono text-[10.5px] text-[var(--muted)]" suppressHydrationWarning>
                {relative(it.at)}
              </time>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
