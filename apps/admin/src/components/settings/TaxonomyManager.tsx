'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button, cn, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { ConfirmDialog } from '../ui/Controls';

export interface TaxonomyList {
  key: string;
  label: string;
  /** Where the list is used, e.g. "Events → Category". */
  usedIn: string;
  values: string[];
  /** How many items use each value (including values no longer in the list). */
  usage: Record<string, number>;
  isDefault: boolean;
}

interface Row {
  /** Value as saved (undefined for new rows) — used to detect renames. */
  original?: string;
  value: string;
}

const input =
  'h-10 w-full min-w-0 rounded-token-md border border-mist/[0.14] bg-field/80 px-3 text-[14px] text-[var(--fg)] outline-none transition focus:border-brand-300/60';
const iconBtn =
  'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-mist/[0.12] text-[var(--muted)] transition hover:border-mist/30 hover:text-[var(--fg)] disabled:opacity-30';

function ListEditor({ list }: { list: TaxonomyList }) {
  const router = useRouter();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>(() => list.values.map((v) => ({ original: v, value: v })));
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saved = list.values.join('\n');
  const dirty = rows.map((r) => r.value.trim()).join('\n') !== saved;
  const retired = Object.entries(list.usage).filter(([v, n]) => n > 0 && !list.values.includes(v));

  const update = (i: number, value: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, value } : r)));
  const move = (i: number, by: number) =>
    setRows((rs) => {
      const next = [...rs];
      const [r] = next.splice(i, 1);
      next.splice(i + by, 0, r!);
      return next;
    });
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (rows.some((r) => r.value.trim().toLowerCase() === v.toLowerCase())) {
      toast(`“${v}” is already in the list`);
      return;
    }
    setRows((rs) => [...rs, { value: v }]);
    setDraft('');
  };

  const save = async () => {
    const values = rows.map((r) => r.value.trim()).filter(Boolean);
    const renames = Object.fromEntries(
      rows.filter((r) => r.original && r.value.trim() && r.value.trim() !== r.original).map((r) => [r.original!, r.value.trim()])
    );
    setSaving(true);
    const res = await api<{ moved?: number }>('/api/taxonomies', { method: 'PUT', body: { key: list.key, values, renames } });
    setSaving(false);
    if (!res.ok) {
      toast(res.error ?? 'Could not save');
      return;
    }
    const moved = Number(res.raw?.moved) || 0;
    toast(moved ? `${list.label} saved — ${moved} item${moved === 1 ? '' : 's'} moved to the new name` : `${list.label} saved`);
    router.refresh();
  };

  const reset = async () => {
    setSaving(true);
    const res = await api(`/api/taxonomies?key=${encodeURIComponent(list.key)}`, { method: 'DELETE' });
    setSaving(false);
    setConfirmReset(false);
    if (!res.ok) {
      toast(res.error ?? 'Could not reset');
      return;
    }
    toast(`${list.label} reset to the defaults`);
    router.refresh();
  };

  return (
    <section className="rounded-token-xl border border-mist/[0.08] bg-mist/[0.02] p-5 md:p-6" aria-labelledby={`tx-${list.key}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={`tx-${list.key}`} className="font-display text-[20px] font-medium tracking-[-0.03em] text-[var(--fg)]">
            {list.label}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
            {list.usedIn} · {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
            {list.isDefault ? ' · default list' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {!list.isDefault && (
            <button type="button" onClick={() => setConfirmReset(true)} className={cn(iconBtn, 'inline-flex w-auto gap-1.5 px-3 text-[12.5px]')} disabled={saving}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Defaults
            </button>
          )}
          <Button size="sm" onClick={() => void save()} disabled={!dirty || saving}>
            <Save className="h-4 w-4" aria-hidden /> {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {rows.map((r, i) => {
          const used = r.original ? (list.usage[r.original] ?? 0) : 0;
          const renamed = r.original && r.value.trim() && r.value.trim() !== r.original;
          return (
            <li key={r.original ?? `new-${i}`} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right font-mono text-[11px] text-[var(--muted)]">{i + 1}</span>
              <input aria-label={`${list.label} ${i + 1}`} className={input} value={r.value} maxLength={60} onChange={(e) => update(i, e.target.value)} />
              <span
                className={cn('hidden w-24 shrink-0 text-[11.5px] sm:block', renamed ? 'text-gold' : 'text-[var(--muted)]')}
                title={renamed ? `Items using “${r.original}” will move to the new name` : undefined}
              >
                {renamed ? `renames ${used}` : r.original ? `${used} item${used === 1 ? '' : 's'}` : 'new'}
              </span>
              <button type="button" className={iconBtn} aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" aria-hidden />
              </button>
              <button type="button" className={iconBtn} aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={cn(iconBtn, 'hover:border-bad/40 hover:text-bad')}
                aria-label={`Remove ${r.value}`}
                disabled={rows.length <= 1}
                title={used ? `${used} item${used === 1 ? '' : 's'} keep this value until edited` : undefined}
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center gap-2 pl-8">
        <input
          aria-label={`New ${list.label.toLowerCase()}`}
          className={input}
          placeholder="Add a new entry…"
          value={draft}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className={cn(iconBtn, 'inline-flex w-auto gap-1.5 px-3 text-[12.5px] text-[var(--fg)]')}>
          <Plus className="h-4 w-4" aria-hidden /> Add
        </button>
      </div>

      {retired.length > 0 && (
        <p className="mt-3 pl-8 text-[12px] text-[var(--muted)]">
          Still used but not in the list: {retired.map(([v, n]) => `${v} (${n})`).join(', ')}. Those items keep their value until edited.
        </p>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset to the default list?"
        description="Your custom entries are removed from the list. Existing content keeps its current values."
        confirmLabel="Reset list"
        busy={saving}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => void reset()}
      />
    </section>
  );
}

export function TaxonomyManager({ lists }: { lists: TaxonomyList[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {lists.map((l) => (
        // Re-mount after a save so the rows reflect the stored list.
        <ListEditor key={`${l.key}:${l.values.join('|')}`} list={l} />
      ))}
    </div>
  );
}
