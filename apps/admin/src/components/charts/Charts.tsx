'use client';

/**
 * Hand-built SVG charts for the admin console (no chart library).
 *
 * Conventions (dataviz method): thin marks, 4px rounded data ends anchored to the baseline,
 * 2px lines, recessive hairline grid, one axis per chart, categorical colours from the
 * validated --series-N slots in fixed order, reserved status colours for payment states,
 * text always in text tokens (never the series colour), hover tooltips on every mark and a
 * table view for every chart.
 */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { BarChart3, CheckCircle2, CircleSlash, Clock, Table2, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@ascend/ui';

export const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)'];
export const ORDINAL = ['var(--ordinal-1)', 'var(--ordinal-2)', 'var(--ordinal-3)', 'var(--ordinal-4)'];
const SEQ = ['var(--seq-0)', 'var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)'];

export type ValueFormat = 'number' | 'inr' | 'percent';

export function formatValue(v: number, f: ValueFormat = 'number', compact = false): string {
  if (f === 'percent') return `${v}%`;
  const abs = Math.abs(v);
  let s: string;
  if (compact && abs >= 1_00_00_000) s = `${(v / 1_00_00_000).toFixed(1).replace(/\.0$/, '')}Cr`;
  else if (compact && abs >= 1_00_000) s = `${(v / 1_00_000).toFixed(1).replace(/\.0$/, '')}L`;
  else if (compact && abs >= 1000) s = `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  else s = v.toLocaleString('en-IN');
  return f === 'inr' ? `₹${s}` : s;
}

/** Rounds a max up to a clean axis ceiling and returns tick values. */
function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  if (ticks[ticks.length - 1]! < max) ticks.push(ticks[ticks.length - 1]! + step);
  return ticks;
}

function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(240, Math.round(w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* ------------------------------------------------------------------------------------------ */
/* Tooltip                                                                                     */
/* ------------------------------------------------------------------------------------------ */

interface TipRow {
  label: string;
  value: string;
  color?: string;
}
interface TipState {
  x: number;
  y: number;
  title: string;
  rows: TipRow[];
}

function Tooltip({ tip, width }: { tip: TipState | null; width: number }) {
  if (!tip) return null;
  const left = Math.min(Math.max(tip.x, 90), width - 90);
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-20 min-w-[150px] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-mist/[0.14] bg-bg/95 px-3 py-2.5 shadow-[0_20px_40px_-20px_rgb(var(--black-rgb)/0.9)] backdrop-blur-md"
      style={{ left, top: tip.y }}
    >
      <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted)]">{tip.title}</p>
      <ul className="flex flex-col gap-1">
        {tip.rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
              {r.color && <span aria-hidden className="h-[2px] w-3 rounded-full" style={{ background: r.color }} />}
              {r.label}
            </span>
            <span className="font-display text-[14px] font-semibold tabular-nums text-[var(--fg)]">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* ChartCard — title, legend, chart/table toggle                                               */
/* ------------------------------------------------------------------------------------------ */

export interface TableSpec {
  columns: string[];
  rows: (string | number)[][];
}

export function ChartCard({
  title,
  description,
  legend,
  table,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  legend?: { label: string; color: string; shape?: 'line' | 'rect' }[];
  table?: TableSpec;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <section
      className={cn(
        'relative flex min-w-0 flex-col overflow-hidden rounded-token-lg border border-mist/[0.1] bg-grad-surface shadow-[0_30px_60px_-40px_rgb(var(--black-rgb)/0.8)]',
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6">
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-medium tracking-[-0.01em] text-[var(--fg)]">{title}</h2>
          {description && <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {table && (
            <div className="flex rounded-full border border-mist/[0.12] p-0.5" role="group" aria-label={`${title} view`}>
              <button
                type="button"
                onClick={() => setView('chart')}
                aria-pressed={view === 'chart'}
                className={cn('grid h-7 w-7 place-items-center rounded-full transition', view === 'chart' ? 'bg-mist/[0.1] text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]')}
                aria-label="Chart view"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                aria-pressed={view === 'table'}
                className={cn('grid h-7 w-7 place-items-center rounded-full transition', view === 'table' ? 'bg-mist/[0.1] text-[var(--fg)]' : 'text-[var(--muted)] hover:text-[var(--fg)]')}
                aria-label="Table view"
              >
                <Table2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>
      {legend && legend.length > 1 && view === 'chart' && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pt-3 md:px-6" aria-label="Legend">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
              <span
                aria-hidden
                className={l.shape === 'line' ? 'h-[2px] w-4 rounded-full' : 'h-2.5 w-2.5 rounded-[3px]'}
                style={{ background: l.color }}
              />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className="flex-1 px-5 pb-5 pt-4 md:px-6">
        {view === 'chart' || !table ? (
          children
        ) : (
          <div className="max-h-[320px] overflow-auto rounded-xl border border-mist/[0.08]">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-bg/95">
                <tr>
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn('px-3 py-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[var(--muted)]', i > 0 && 'text-right')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-mist/[0.06]">
                    {row.map((cell, ci) => (
                      <td key={ci} className={cn('px-3 py-2 text-[var(--fg)]', ci > 0 && 'text-right tabular-nums')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export function ChartEmpty({ children, height = 220 }: { children: React.ReactNode; height?: number }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-mist/[0.12] px-6 text-center text-[13px] text-[var(--muted)]" style={{ height }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Line / area time series with crosshair                                                      */
/* ------------------------------------------------------------------------------------------ */

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  area?: boolean;
}

export function LineChart({
  labels,
  series,
  format = 'number',
  height = 260,
}: {
  labels: string[];
  series: LineSeries[];
  format?: ValueFormat;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, '');
  const pad = { top: 16, right: 16, bottom: 28, left: 44 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const n = labels.length;
  const x = (i: number) => pad.left + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad.top + h - (v / top) * h;
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 70))));

  const onMove = useCallback(
    (e: React.PointerEvent<SVGRectElement>) => {
      const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
      const px = e.clientX - rect.left;
      const i = n <= 1 ? 0 : Math.round((px / rect.width) * (n - 1));
      setHover(Math.min(n - 1, Math.max(0, i)));
    },
    [n]
  );

  const tip: TipState | null =
    hover === null
      ? null
      : {
          x: x(hover),
          y: Math.min(...series.map((s) => y(s.values[hover] ?? 0))),
          title: labels[hover] ?? '',
          rows: series.map((s) => ({ label: s.label, value: formatValue(s.values[hover] ?? 0, format), color: s.color })),
        };

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      <svg width={width} height={height} role="img" aria-label={`${series.map((s) => s.label).join(' and ')} over time`}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${gid}-${s.key}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" style={{ stopColor: s.color }} stopOpacity="0.28" />
              <stop offset="1" style={{ stopColor: s.color }} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--chart-grid)' }} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-[var(--muted)] font-mono text-[10.5px]">
              {formatValue(t, format, true)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[10.5px]">
              {l}
            </text>
          ) : null
        )}
        {series.map((s) => {
          const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
          return (
            <g key={s.key}>
              {s.area && n > 1 && (
                <path d={`M${x(0)},${y(0)} L${pts.join(' L')} L${x(n - 1)},${y(0)} Z`} fill={`url(#${gid}-${s.key})`} />
              )}
              <polyline points={pts.join(' ')} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" style={{ stroke: s.color }} />
              {n > 0 && (
                <circle cx={x(n - 1)} cy={y(s.values[n - 1] ?? 0)} r={4} strokeWidth={2} style={{ fill: s.color, stroke: 'var(--surface-hi)' }} />
              )}
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + h} style={{ stroke: 'var(--chart-axis)' }} />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(s.values[hover] ?? 0)} r={4.5} strokeWidth={2} style={{ fill: s.color, stroke: 'var(--surface-hi)' }} />
            ))}
          </g>
        )}
        <rect
          x={pad.left}
          y={pad.top}
          width={Math.max(0, w)}
          height={Math.max(0, h)}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          tabIndex={0}
          aria-label="Move with arrow keys to read values"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setHover((p) => Math.min(n - 1, (p ?? -1) + 1));
            if (e.key === 'ArrowLeft') setHover((p) => Math.max(0, (p ?? n) - 1));
          }}
          onBlur={() => setHover(null)}
          className="cursor-crosshair outline-none"
        />
      </svg>
      <Tooltip tip={tip} width={width} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Column chart (single series)                                                                */
/* ------------------------------------------------------------------------------------------ */

export function ColumnChart({
  labels,
  values,
  color = 'var(--series-1)',
  format = 'number',
  height = 240,
  seriesLabel,
}: {
  labels: string[];
  values: number[];
  color?: string;
  format?: ValueFormat;
  height?: number;
  seriesLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 22, right: 8, bottom: 28, left: 48 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const n = Math.max(1, values.length);
  const max = Math.max(1, ...values);
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1]!;
  const slot = w / n;
  const bw = Math.max(3, Math.min(24, slot - 4));
  const y = (v: number) => pad.top + h - (v / top) * h;
  const maxIdx = values.indexOf(Math.max(...values));
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(w / 64))));

  const barPath = (x0: number, v: number) => {
    const y0 = pad.top + h;
    const y1 = y(v);
    const r = Math.min(4, bw / 2, Math.max(0, y0 - y1));
    return `M${x0},${y0} L${x0},${y1 + r} Q${x0},${y1} ${x0 + r},${y1} L${x0 + bw - r},${y1} Q${x0 + bw},${y1} ${x0 + bw},${y1 + r} L${x0 + bw},${y0} Z`;
  };

  const tip: TipState | null =
    hover === null
      ? null
      : { x: pad.left + slot * hover + slot / 2, y: y(values[hover] ?? 0), title: labels[hover] ?? '', rows: [{ label: seriesLabel, value: formatValue(values[hover] ?? 0, format), color }] };

  return (
    <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
      <svg width={width} height={height} role="img" aria-label={seriesLabel}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} style={{ stroke: 'var(--chart-grid)' }} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-[var(--muted)] font-mono text-[10.5px]">
              {formatValue(t, format, true)}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const x0 = pad.left + slot * i + (slot - bw) / 2;
          return (
            <g key={i}>
              {v > 0 && <path d={barPath(x0, v)} style={{ fill: color, opacity: hover === null || hover === i ? 1 : 0.45 }} className="transition-opacity" />}
              {i === maxIdx && v > 0 && (
                <text x={x0 + bw / 2} y={y(v) - 6} textAnchor="middle" className="fill-[var(--fg)] font-mono text-[10.5px] font-medium">
                  {formatValue(v, format, true)}
                </text>
              )}
              {(i % labelEvery === 0 || i === n - 1) && (
                <text x={pad.left + slot * i + slot / 2} y={height - 8} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[10.5px]">
                  {labels[i]}
                </text>
              )}
              <rect
                x={pad.left + slot * i}
                y={pad.top}
                width={slot}
                height={h}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={-1}
              />
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} width={width} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Horizontal bars (categories)                                                                */
/* ------------------------------------------------------------------------------------------ */

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  color?: string;
}

export function HBarChart({ data, format = 'number', seriesLabel, useEntityColor = false }: { data: BarDatum[]; format?: ValueFormat; seriesLabel: string; useEntityColor?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className="flex flex-col gap-3" aria-label={seriesLabel}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = useEntityColor && d.color ? d.color : d.key === '__other' ? 'var(--chart-axis)' : SERIES[Math.min(i, SERIES.length - 1)]!;
        return (
          <li key={d.key} className="group" title={`${d.label}: ${formatValue(d.value, format)}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
              <span className="flex min-w-0 items-center gap-2 text-[var(--fg)]">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[var(--fg)]">
                {formatValue(d.value, format)}
                {total > 0 && <span className="ml-1.5 text-[11.5px] text-[var(--muted)]">{Math.round((d.value / total) * 100)}%</span>}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-mist/[0.06]">
              <div
                className="h-full rounded-full transition-[width,filter] duration-700 group-hover:brightness-125"
                style={{ width: `${Math.max(pct, d.value > 0 ? 2 : 0)}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Status mix — one stacked bar with 2px surface gaps, reserved status colours + icons         */
/* ------------------------------------------------------------------------------------------ */

const STATUS_STYLE: Record<string, { color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  paid: { color: 'var(--ok)', Icon: CheckCircle2 },
  pending: { color: 'var(--warn)', Icon: Clock },
  failed: { color: 'var(--bad)', Icon: XCircle },
  refunded: { color: 'var(--muted)', Icon: RotateCcw },
  not_required: { color: 'var(--series-1)', Icon: CircleSlash },
};

export function StatusMix({ data }: { data: BarDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  if (!total) return <ChartEmpty height={140}>No registrations in this period yet.</ChartEmpty>;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-[6px]" role="img" aria-label="Payment status mix">
        {data
          .filter((d) => d.value > 0)
          .map((d) => (
            <div
              key={d.key}
              className="h-full transition-opacity first:rounded-l-[4px] last:rounded-r-[4px]"
              style={{ width: `${(d.value / total) * 100}%`, background: STATUS_STYLE[d.key]?.color, opacity: hover && hover !== d.key ? 0.4 : 1 }}
              onPointerEnter={() => setHover(d.key)}
              onPointerLeave={() => setHover(null)}
              title={`${d.label}: ${d.value}`}
            />
          ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 2xl:grid-cols-3">
        {data.map((d) => {
          const s = STATUS_STYLE[d.key];
          const Icon = s?.Icon ?? CircleSlash;
          return (
            <li
              key={d.key}
              className={cn('flex items-center gap-3 rounded-xl border border-mist/[0.08] p-3 transition', hover === d.key && 'border-mist/[0.24] bg-mist/[0.04]')}
              onPointerEnter={() => setHover(d.key)}
              onPointerLeave={() => setHover(null)}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${s?.color} 16%, transparent)`, color: s?.color }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[18px] font-semibold leading-none tabular-nums text-[var(--fg)]">{d.value}</span>
                <span className="mt-1 block truncate text-[11.5px] text-[var(--muted)]">
                  {d.label} · {Math.round((d.value / total) * 100)}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Funnel — ordinal blue ramp, % of first stage                                               */
/* ------------------------------------------------------------------------------------------ */

export function Funnel({ data }: { data: BarDatum[] }) {
  const first = data[0]?.value || 0;
  if (!first) return <ChartEmpty height={200}>The funnel fills as registrations arrive.</ChartEmpty>;
  return (
    <ol className="flex flex-col gap-2.5" aria-label="Registration funnel">
      {data.map((d, i) => {
        const pct = Math.round((d.value / first) * 100);
        const drop = i > 0 && data[i - 1]!.value > 0 ? Math.round(((data[i - 1]!.value - d.value) / data[i - 1]!.value) * 100) : null;
        return (
          <li key={d.key} className="flex items-center gap-3">
            <span className="w-[104px] shrink-0 text-[12.5px] text-[var(--muted)]">{d.label}</span>
            <div className="relative h-9 flex-1">
              <div
                className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center rounded-[6px] transition-[width] duration-700"
                style={{ width: `${Math.max(pct, 6)}%`, background: ORDINAL[Math.min(i, ORDINAL.length - 1)] }}
                title={`${d.label}: ${d.value}`}
              >
                {pct >= 18 && <span className="font-display text-[14px] font-semibold tabular-nums text-white">{d.value}</span>}
              </div>
            </div>
            <span className="w-[72px] shrink-0 text-right tabular-nums">
              <span className="block text-[13px] text-[var(--fg)]">{pct}%</span>
              {drop !== null && drop > 0 && <span className="block text-[10.5px] text-[var(--muted)]">−{drop}% step</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Seat fill meters                                                                            */
/* ------------------------------------------------------------------------------------------ */

export function SeatFillList({ data }: { data: { id: string; title: string; date: string; taken: number; total: number }[] }) {
  if (!data.length) return <ChartEmpty height={180}>No upcoming published events with a seat capacity.</ChartEmpty>;
  return (
    <ul className="flex flex-col gap-4">
      {data.map((e) => {
        const pct = Math.min(100, Math.round((e.taken / e.total) * 100));
        const tone = pct >= 100 ? 'var(--bad)' : pct >= 80 ? 'var(--warn)' : 'var(--series-1)';
        return (
          <li key={e.id}>
            <a href={`/events/${e.id}/registrations`} className="group block rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-300">
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] text-[var(--fg)] group-hover:text-white">{e.title}</span>
                <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-[var(--muted)]">
                  {e.taken.toLocaleString('en-IN')}/{e.total.toLocaleString('en-IN')} · <span className="text-[var(--fg)]">{pct}%</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${tone} 16%, transparent)` }}>
                <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(pct, 1)}%`, background: tone }} />
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Radial gauge — single headline proportion                                                   */
/* ------------------------------------------------------------------------------------------ */

export function RadialGauge({ value, total, label, sublabel }: { value: number; total: number; label: string; sublabel?: string }) {
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = 70;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setShown(pct);
    const t = setTimeout(() => setShown(pct), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="relative mx-auto grid w-full max-w-[220px] place-items-center">
      <svg viewBox="0 0 180 180" className="w-full" role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`}>
        <circle cx="90" cy="90" r={r} fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} transform="rotate(135 90 90)" style={{ stroke: 'rgb(var(--mist-rgb) / 0.08)' }} />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arc * shown} ${c}`}
          transform="rotate(135 90 90)"
          style={{ stroke: 'var(--gold)', transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)', filter: 'drop-shadow(0 0 10px rgb(var(--gold-rgb) / 0.45))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 text-center">
        <span className="font-display text-[40px] font-semibold leading-none tracking-[-0.04em] text-[var(--fg)]">{Math.round(pct * 100)}%</span>
        <span className="mt-1.5 text-[11.5px] text-[var(--muted)]">{label}</span>
        {sublabel && <span className="mt-0.5 font-mono text-[10.5px] text-[var(--muted)]">{sublabel}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Heatmap — weekday × hour, sequential blue                                                   */
/* ------------------------------------------------------------------------------------------ */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(0, ...grid.flat());
  const [tip, setTip] = useState<{ d: number; h: number; v: number } | null>(null);
  const level = (v: number) => (v === 0 || max === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5)));
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[36px_repeat(24,minmax(0,1fr))] gap-[3px]">
            <span />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="text-center font-mono text-[9.5px] text-[var(--muted)]">
                {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
              </span>
            ))}
            {grid.map((row, d) => (
              <React.Fragment key={d}>
                <span className="self-center font-mono text-[10.5px] text-[var(--muted)]">{WEEKDAYS[d]}</span>
                {row.map((v, h) => (
                  <button
                    key={h}
                    type="button"
                    aria-label={`${WEEKDAYS[d]} ${String(h).padStart(2, '0')}:00 — ${v} registrations`}
                    onPointerEnter={() => setTip({ d, h, v })}
                    onFocus={() => setTip({ d, h, v })}
                    onPointerLeave={() => setTip(null)}
                    onBlur={() => setTip(null)}
                    className={cn('aspect-square rounded-[4px] transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold', tip && tip.d === d && tip.h === h && 'ring-2 ring-gold')}
                    style={{ background: SEQ[level(v)] }}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-[var(--muted)]">
        <span aria-live="polite">
          {tip ? (
            <>
              <span className="text-[var(--fg)]">{tip.v}</span> registration{tip.v === 1 ? '' : 's'} · {WEEKDAYS[tip.d]} {String(tip.h).padStart(2, '0')}:00–{String((tip.h + 1) % 24).padStart(2, '0')}:00 IST
            </>
          ) : (
            'Hover a cell for details · times in IST'
          )}
        </span>
        <span className="flex items-center gap-1.5">
          Less
          {SEQ.map((c, i) => (
            <span key={i} aria-hidden className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Sparkline                                                                                   */
/* ------------------------------------------------------------------------------------------ */

export function Sparkline({ values, color = 'var(--series-1)', className }: { values: number[]; color?: string; className?: string }) {
  const gid = useId().replace(/:/g, '');
  const path = useMemo(() => {
    if (values.length < 2) return null;
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 28 - (v / max) * 24] as const);
    return {
      line: pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
      area: `M0,30 L${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L')} L100,30 Z`,
      last: pts[pts.length - 1]!,
    };
  }, [values]);
  if (!path) return null;
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn('h-9 w-full overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: color }} stopOpacity="0.3" />
          <stop offset="1" style={{ stopColor: color }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${gid})`} />
      <polyline points={path.line} fill="none" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" style={{ stroke: color }} />
    </svg>
  );
}
