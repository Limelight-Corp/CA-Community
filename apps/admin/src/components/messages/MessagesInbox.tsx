'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Mail, MailOpen, Phone } from 'lucide-react';
import type { CommunityContactMessage } from '@ascend/shared';
import { cn, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { filterMessages } from '../../lib/filters';
import { formatDateTime } from '../../lib/format';
import { Chip } from '../ui/Display';
import { SearchInput } from '../ui/Controls';

const VIEWS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'new', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
] as const;

export function MessagesInbox({ rows }: { rows: CommunityContactMessage[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<string>('inbox');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => filterMessages(rows, view, q), [rows, view, q]);
  const counts = {
    inbox: rows.filter((m) => m.status !== 'archived').length,
    new: rows.filter((m) => m.status === 'new').length,
    archived: rows.filter((m) => m.status === 'archived').length,
  };

  const setStatus = async (m: CommunityContactMessage, status: CommunityContactMessage['status'], silent = false) => {
    setBusy(m.id);
    const res = await api('/api/messages', { method: 'PATCH', body: { id: m.id, status } });
    setBusy(null);
    if (!res.ok) {
      toast(res.error ?? 'Could not update the message');
      return;
    }
    if (!silent) toast(status === 'archived' ? 'Message archived' : status === 'new' ? 'Marked unread' : 'Moved to inbox');
    router.refresh();
  };

  const open = (m: CommunityContactMessage) => {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && m.status === 'new') void setStatus(m, 'read', true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div role="group" aria-label="Message folders" className="flex w-full gap-1 rounded-full border border-mist/[0.1] bg-field/60 p-1 sm:w-auto">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              onClick={() => setView(v.value)}
              className={cn(
                'flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium transition sm:flex-none',
                view === v.value ? 'bg-brand-500 text-white' : 'text-[var(--muted)] hover:text-[var(--fg)]'
              )}
            >
              {v.label}
              <span className="ml-1.5 font-mono text-[11px] opacity-80">{counts[v.value]}</span>
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, subject…" label="Search messages" />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-token-lg border border-dashed border-mist/[0.14] px-6 py-14 text-center text-[14px] text-[var(--muted)]">
          {rows.length === 0 ? 'No contact form messages yet.' : 'Nothing here.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((m) => {
            const expanded = openId === m.id;
            const unread = m.status === 'new';
            return (
              <li key={m.id} className={cn('overflow-hidden rounded-2xl border transition', expanded ? 'border-brand-300/35 bg-brand-500/[0.06]' : 'border-mist/[0.08] bg-mist/[0.02]')}>
                <button
                  type="button"
                  onClick={() => open(m)}
                  aria-expanded={expanded}
                  aria-controls={`msg-${m.id}`}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                >
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', unread ? 'bg-gold shadow-[0_0_8px_var(--gold)]' : 'bg-transparent')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className={cn('truncate text-[14px]', unread ? 'font-semibold text-[var(--fg)]' : 'font-medium text-[var(--fg)]')}>
                        {m.name}
                        {unread && <span className="sr-only"> (unread)</span>}
                      </span>
                      <span className="shrink-0 font-mono text-[11.5px] text-[var(--muted)]">{formatDateTime(m.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13.5px] text-[var(--fg)]">{m.subject}</span>
                    {!expanded && <span className="mt-0.5 block truncate text-[12.5px] text-[var(--muted)]">{m.message}</span>}
                  </span>
                </button>
                {expanded && (
                  <div id={`msg-${m.id}`} className="flex flex-col gap-4 border-t border-mist/[0.08] px-4 pb-4 pt-4 sm:pl-9">
                    <div className="flex flex-wrap gap-2 text-[13px]">
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.12] px-3 py-1.5 text-brand-100 hover:border-brand-300/50">
                        <Mail className="h-3.5 w-3.5" aria-hidden />
                        {m.email}
                      </a>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.12] px-3 py-1.5 text-brand-100 hover:border-brand-300/50">
                          <Phone className="h-3.5 w-3.5" aria-hidden />
                          {m.phone}
                        </a>
                      )}
                      {m.status === 'archived' && <Chip>Archived</Chip>}
                    </div>
                    <p className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-[var(--fg)]">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      {m.status === 'archived' ? (
                        <button type="button" disabled={busy === m.id} onClick={() => void setStatus(m, 'read')} className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.12] px-3.5 py-2 text-[12.5px] font-medium text-[var(--fg)] hover:border-brand-300/50 disabled:opacity-40">
                          <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                          Move to inbox
                        </button>
                      ) : (
                        <button type="button" disabled={busy === m.id} onClick={() => void setStatus(m, 'archived')} className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.12] px-3.5 py-2 text-[12.5px] font-medium text-[var(--fg)] hover:border-brand-300/50 disabled:opacity-40">
                          <Archive className="h-3.5 w-3.5" aria-hidden />
                          Archive
                        </button>
                      )}
                      {m.status !== 'new' && (
                        <button type="button" disabled={busy === m.id} onClick={() => void setStatus(m, 'new')} className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.12] px-3.5 py-2 text-[12.5px] font-medium text-[var(--fg)] hover:border-brand-300/50 disabled:opacity-40">
                          <MailOpen className="h-3.5 w-3.5" aria-hidden />
                          Mark unread
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
