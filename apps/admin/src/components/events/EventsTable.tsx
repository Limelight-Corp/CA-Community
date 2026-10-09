'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, Pencil, Star } from 'lucide-react';
import { useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { formatDate, formatFee, formatINR, todayISO } from '../../lib/format';
import { Chip, DataTable, EmptyRow, Panel, SeatBar } from '../ui/Display';
import { FilterSelect, SearchInput, Toolbar } from '../ui/Controls';

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  mode: string;
  category: string;
  fee: number;
  seatsTaken: number;
  seatsTotal: number;
  registrations: number;
  revenue: number;
  isPublished: boolean;
  registrationOpen: boolean;
  featured: boolean;
  imageUrl?: string;
}

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Registrations open' },
  { value: 'closed', label: 'Registrations closed' },
];

function InlineToggle({
  on,
  label,
  onLabel,
  offLabel,
  busy,
  onToggle,
}: {
  on: boolean;
  label: string;
  onLabel: string;
  offLabel: string;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      className="group inline-flex items-center gap-2 rounded-full py-1 text-[12.5px] font-medium text-[var(--muted)] disabled:opacity-50"
    >
      <span
        aria-hidden
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${on ? 'border-brand-400 bg-brand-500' : 'border-mist/[0.16] bg-mist/[0.08]'}`}
      >
        <span className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-fg transition-[left] ${on ? 'left-[calc(100%-1rem)]' : 'left-0.5'}`} />
      </span>
      <span className={on ? 'text-[var(--fg)]' : undefined}>{on ? onLabel : offLabel}</span>
    </button>
  );
}

export function EventsTable({ rows, initialStatus = '' }: { rows: EventRow[]; initialStatus?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS.some((o) => o.value === initialStatus) ? initialStatus : '');
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = todayISO();

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (needle && ![r.title, r.city, r.venue, r.category, r.slug].some((v) => (v ?? '').toLowerCase().includes(needle))) return false;
      switch (status) {
        case 'upcoming':
          return r.date >= today;
        case 'past':
          return r.date < today;
        case 'published':
          return r.isPublished;
        case 'draft':
          return !r.isPublished;
        case 'open':
          return r.registrationOpen;
        case 'closed':
          return !r.registrationOpen;
        default:
          return true;
      }
    });
  }, [rows, q, status, today]);

  const toggle = async (row: EventRow, field: 'isPublished' | 'registrationOpen') => {
    setBusyId(row.id);
    const next = !row[field];
    const res = await api('/api/community', { method: 'PUT', body: { type: 'events', id: row.id, updates: { [field]: next } } });
    setBusyId(null);
    if (!res.ok) {
      toast(res.error ?? 'Could not update the event');
      return;
    }
    toast(
      field === 'isPublished'
        ? next
          ? `"${row.title}" is now live`
          : `"${row.title}" moved to drafts`
        : next
          ? 'Registrations opened'
          : 'Registrations closed'
    );
    router.refresh();
  };

  return (
    <Panel padded>
      <div className="flex flex-col gap-5">
        <Toolbar>
          <SearchInput value={q} onChange={setQ} placeholder="Search title, city, venue…" label="Search events" />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <span className="text-[12.5px] text-[var(--muted)] sm:ml-auto" aria-live="polite">
            {filtered.length} of {rows.length} events
          </span>
        </Toolbar>

        <DataTable label="Events">
          <thead>
            <tr>
              <th scope="col">Event</th>
              <th scope="col">Date</th>
              <th scope="col">Fee</th>
              <th scope="col" className="min-w-[160px]">Seats</th>
              <th scope="col">Revenue</th>
              <th scope="col">Website</th>
              <th scope="col">Registrations</th>
              <th scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <EmptyRow colSpan={8}>No events match these filters.</EmptyRow>}
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="max-w-[320px]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-mist/[0.1] bg-grad-tile">
                      {r.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <CalendarDays className="h-4 w-4 text-brand-200" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/events/${r.id}`} className="block truncate font-medium text-[var(--fg)] hover:text-brand-100">
                        {r.title}
                      </Link>
                      <span className="flex items-center gap-1.5 truncate text-[12px] text-[var(--muted)]">
                        {r.featured && <Star className="h-3 w-3 shrink-0 fill-gold text-gold" aria-label="Featured" />}
                        {r.category} · {r.mode === 'Online' ? 'Online' : r.city || r.venue}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap">
                  <span className="block text-[var(--fg)]">{formatDate(r.date)}</span>
                  <span className="text-[12px] text-[var(--muted)]">{r.time}</span>
                  {r.date < today && (
                    <div className="mt-1">
                      <Chip>Past</Chip>
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap font-mono text-[13px] tabular-nums">{formatFee(r.fee)}</td>
                <td>
                  <SeatBar taken={r.seatsTaken} total={r.seatsTotal} />
                </td>
                <td className="whitespace-nowrap font-mono text-[13px] tabular-nums text-gold">{formatINR(r.revenue)}</td>
                <td>
                  <InlineToggle
                    on={r.isPublished}
                    label={`Publish ${r.title}`}
                    onLabel="Live"
                    offLabel="Draft"
                    busy={busyId === r.id}
                    onToggle={() => toggle(r, 'isPublished')}
                  />
                </td>
                <td>
                  <InlineToggle
                    on={r.registrationOpen}
                    label={`Registrations for ${r.title}`}
                    onLabel="Open"
                    offLabel="Closed"
                    busy={busyId === r.id}
                    onToggle={() => toggle(r, 'registrationOpen')}
                  />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/events/${r.id}/registrations`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-mist/[0.12] px-3 py-1.5 text-[12.5px] font-medium text-[var(--fg)] hover:border-brand-300/50"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-brand-200" aria-hidden />
                      Manage
                      <span className="rounded-full bg-brand-500/20 px-1.5 font-mono text-[10.5px]">{r.registrations}</span>
                    </Link>
                    <Link
                      href={`/events/${r.id}`}
                      className="grid h-8 w-8 place-items-center rounded-full border border-mist/[0.12] text-[var(--muted)] hover:text-[var(--fg)]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Edit {r.title}</span>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </Panel>
  );
}
