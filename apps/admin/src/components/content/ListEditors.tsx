'use client';

/**
 * Structured list editors for the CMS form:
 *   PointsEditor — numbered bullet points (highlights, talks) with add / remove / reorder
 *   StatsEditor  — number + label pairs ("15+" / "Years in practice") with a live preview
 * Enter in a row adds the next row; empty rows are dropped when the form is saved.
 */
import React, { useEffect, useId, useRef } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { cn, fieldInputClass } from '@ascend/ui';

export interface StatItem {
  value: string;
  label: string;
}

interface Shell {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  max: number;
  count: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function EditorShell({ label, hint, error, className, max, count, children, footer }: Shell) {
  const id = useId();
  return (
    <fieldset className={cn('flex flex-col gap-2.5', className)} aria-describedby={`${id}-hint`}>
      <legend className="mb-1 flex w-full items-center justify-between gap-3 text-[13.5px] font-medium text-[var(--fg)]">
        {label}
        <span className={cn('font-mono text-[11px]', count >= max ? 'text-gold' : 'text-faint')}>
          {count} / {max}
        </span>
      </legend>
      {children}
      {footer}
      {hint && (
        <p id={`${id}-hint`} className="text-[12px] text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[12px] text-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const iconBtn =
  'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-mist/[0.08] hover:text-[var(--fg)] disabled:pointer-events-none disabled:opacity-30';

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Numbered bullet points. */
export function PointsEditor({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  max = 10,
  placeholder = 'Add a point…',
  maxLength = 240,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  const rows = value.length ? value : [''];
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const focusNext = useRef<number | null>(null);

  useEffect(() => {
    if (focusNext.current !== null) {
      refs.current[focusNext.current]?.focus();
      focusNext.current = null;
    }
  });

  const update = (i: number, text: string) => onChange(rows.map((r, j) => (j === i ? text : r)));
  const add = (at = rows.length) => {
    if (rows.length >= max) return;
    const next = [...rows];
    next.splice(at, 0, '');
    focusNext.current = at;
    onChange(next);
  };
  const remove = (i: number) => {
    const next = rows.filter((_, j) => j !== i);
    focusNext.current = Math.max(0, i - 1);
    onChange(next);
  };

  return (
    <EditorShell
      label={label}
      hint={hint}
      error={error}
      className={className}
      max={max}
      count={value.filter((v) => v.trim()).length}
      footer={
        <button
          type="button"
          onClick={() => add()}
          disabled={rows.length >= max}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed border-mist/[0.2] px-3.5 py-1.5 text-[13px] font-medium text-brand-200 transition hover:border-brand-300/60 hover:bg-brand-500/10 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add point
        </button>
      }
    >
      <ol className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={i} className="group flex items-center gap-2 rounded-xl border border-mist/[0.1] bg-bg/40 p-1.5 pl-2 focus-within:border-gold/40">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-grad-primary font-mono text-[11px] font-semibold text-white">
              {String(i + 1).padStart(2, '0')}
            </span>
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={row}
              maxLength={maxLength}
              placeholder={placeholder}
              aria-label={`${label} ${i + 1}`}
              onChange={(e) => update(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add(i + 1);
                } else if (e.key === 'Backspace' && !row && rows.length > 1) {
                  e.preventDefault();
                  remove(i);
                }
              }}
              className={cn(fieldInputClass, 'h-9 min-w-0 flex-1 border-0 bg-transparent px-1.5 py-0 shadow-none focus:ring-0')}
            />
            <span className="flex shrink-0 opacity-60 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <button type="button" className={iconBtn} disabled={i === 0} onClick={() => onChange(move(rows, i, i - 1))} aria-label="Move up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" className={iconBtn} disabled={i === rows.length - 1} onClick={() => onChange(move(rows, i, i + 1))} aria-label="Move down">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" className={cn(iconBtn, 'hover:text-bad')} onClick={() => remove(i)} aria-label={`Remove point ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </EditorShell>
  );
}

/** Number + label pairs with a live preview. */
export function StatsEditor({
  label,
  hint,
  error,
  className,
  value,
  onChange,
  max = 4,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  value: StatItem[];
  onChange: (next: StatItem[]) => void;
  max?: number;
}) {
  const rows = value.length ? value : [{ value: '', label: '' }];
  const update = (i: number, patch: Partial<StatItem>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const filled = value.filter((s) => s.value.trim() && s.label.trim());

  return (
    <EditorShell
      label={label}
      hint={hint}
      error={error}
      className={className}
      max={max}
      count={filled.length}
      footer={
        <>
          <button
            type="button"
            onClick={() => rows.length < max && onChange([...rows, { value: '', label: '' }])}
            disabled={rows.length >= max}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-dashed border-mist/[0.2] px-3.5 py-1.5 text-[13px] font-medium text-brand-200 transition hover:border-brand-300/60 hover:bg-brand-500/10 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden /> Add number
          </button>
          {filled.length > 0 && (
            <div className="mt-1 rounded-xl border border-mist/[0.1] bg-bg/40 p-3">
              <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">Preview</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {filled.map((s, i) => (
                  <div key={i} className="rounded-lg border border-mist/[0.1] bg-mist/[0.03] p-2.5">
                    <p className="font-display text-[22px] font-semibold leading-none text-[var(--fg)]">{s.value}</p>
                    <p className="mt-1 text-[11.5px] text-[var(--muted)]">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      }
    >
      <ol className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li key={i} className="group flex items-center gap-2 rounded-xl border border-mist/[0.1] bg-bg/40 p-1.5 focus-within:border-gold/40">
            <input
              value={row.value}
              maxLength={12}
              placeholder="15+"
              aria-label={`${label} ${i + 1} number`}
              onChange={(e) => update(i, { value: e.target.value })}
              className={cn(fieldInputClass, 'h-9 w-[92px] shrink-0 text-center font-display text-[16px] font-semibold')}
            />
            <input
              value={row.label}
              maxLength={60}
              placeholder="Years in practice"
              aria-label={`${label} ${i + 1} label`}
              onChange={(e) => update(i, { label: e.target.value })}
              className={cn(fieldInputClass, 'h-9 min-w-0 flex-1')}
            />
            <span className="flex shrink-0 opacity-60 transition group-focus-within:opacity-100 group-hover:opacity-100">
              <button type="button" className={iconBtn} disabled={i === 0} onClick={() => onChange(move(rows, i, i - 1))} aria-label="Move up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" className={iconBtn} disabled={i === rows.length - 1} onClick={() => onChange(move(rows, i, i + 1))} aria-label="Move down">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" className={cn(iconBtn, 'hover:text-bad')} onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`Remove number ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </EditorShell>
  );
}
