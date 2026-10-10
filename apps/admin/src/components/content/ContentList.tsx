'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Pencil } from 'lucide-react';
import { cn, useToast, Pagination, usePagination } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { CONTENT_TYPES, type ManagedContentType } from '../../lib/content-config';
import { FilterSelect, SearchInput, Toolbar } from '../ui/Controls';
import { PublishChip } from '../ui/Display';

type Item = Record<string, unknown> & { id: string; isPublished?: boolean };

export function ContentList({ type, items }: { type: ManagedContentType; items: Item[] }) {
  const config = CONTENT_TYPES[type];
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (visibility === 'live' && it.isPublished === false) return false;
      if (visibility === 'draft' && it.isPublished !== false) return false;
      if (!needle) return true;
      return [config.titleField, ...config.subtitleFields].some((k) => String(it[k] ?? '').toLowerCase().includes(needle));
    });
  }, [items, q, visibility, config]);
  const pager = usePagination(filtered, 24, [q, visibility]);

  const togglePublish = async (it: Item) => {
    setBusy(it.id);
    const next = it.isPublished === false;
    const res = await api('/api/community', { method: 'PUT', body: { type, id: it.id, updates: { isPublished: next } } });
    setBusy(null);
    if (!res.ok) {
      toast(res.error ?? 'Could not update');
      return;
    }
    toast(next ? 'Published' : 'Moved to drafts');
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder={`Search ${config.label.toLowerCase()}…`} label={`Search ${config.label}`} />
        <FilterSelect
          label="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: 'live', label: 'Published' },
            { value: 'draft', label: 'Draft' },
          ]}
        />
        <span className="text-[12.5px] text-[var(--muted)] sm:ml-auto" aria-live="polite">
          {filtered.length} of {items.length}
        </span>
      </Toolbar>

      {filtered.length === 0 ? (
        <p className="rounded-token-lg border border-dashed border-mist/[0.14] px-6 py-14 text-center text-[14px] text-[var(--muted)]">
          {items.length === 0 ? `No ${config.label.toLowerCase()} yet.` : 'Nothing matches these filters.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {pager.pageItems.map((it) => {
            const img = config.imageField ? String(it[config.imageField] ?? '') : '';
            const title = String(it[config.titleField] ?? 'Untitled');
            const subtitle = config.subtitleFields
              .map((k) => it[k])
              .filter((v) => v !== undefined && v !== null && v !== '')
              .map(String)
              .join(' · ');
            const published = it.isPublished !== false;
            const color = type === 'wings' ? String(it.color ?? '') : '';
            return (
              <li key={it.id} className="group flex min-w-0 items-center gap-4 rounded-2xl border border-mist/[0.08] bg-grad-surface p-3.5 transition hover:border-brand-300/35">
                <span
                  className={cn(
                    'relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden border border-mist/[0.1] bg-grad-tile',
                    config.imageField === 'avatarUrl' || config.imageField === 'photoUrl' ? 'rounded-full' : 'rounded-xl'
                  )}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  ) : type === 'wings' ? (
                    <span className="font-display text-[18px] font-semibold" style={color ? { color } : undefined}>
                      {String(it.number ?? '')}
                    </span>
                  ) : (
                    <FileText className="h-5 w-5 text-brand-200" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/content/${type}/${encodeURIComponent(it.id)}`} className="block truncate font-medium text-[var(--fg)] hover:text-brand-100">
                    {title}
                  </Link>
                  {subtitle && <p className="truncate text-[12.5px] text-[var(--muted)]">{subtitle}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void togglePublish(it)}
                      disabled={busy === it.id}
                      className="rounded-full disabled:opacity-50"
                      aria-label={`${published ? 'Unpublish' : 'Publish'} ${title}`}
                      title={published ? 'Click to unpublish' : 'Click to publish'}
                    >
                      <PublishChip published={published} />
                    </button>
                  </div>
                </div>
                <Link
                  href={`/content/${type}/${encodeURIComponent(it.id)}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-mist/[0.12] text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Edit {title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} noun="items" />
    </div>
  );
}
