'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, HeartHandshake, Pause, RotateCcw, X } from 'lucide-react';
import { useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { formatDateTime } from '../../lib/format';
import { Chip, DataTable, EmptyRow } from '../ui/Display';
import { ConfirmDialog, TextAreaField } from '../ui/Controls';

export interface MentorRow {
  id: string;
  name: string;
  email: string;
  headline: string;
  expertise: string[];
  wings: string[];
  modes: string[];
  city?: string;
  capacity: number;
  active: number;
  status: 'pending' | 'approved' | 'paused' | 'rejected';
  createdAt: string;
}
export interface RequestRow {
  id: string;
  name: string;
  email: string;
  stage: string;
  goals: string;
  wings: string[];
  preferredMentorId?: string;
  preferredMentor?: string;
  mentorName?: string;
  accountId: string;
  status: 'open' | 'matched' | 'closed' | 'declined';
  adminNote?: string;
  createdAt: string;
}

const MENTOR_TONE = { pending: 'warn', approved: 'ok', paused: 'mute', rejected: 'bad' } as const;
const MENTOR_LABEL = { pending: 'To review', approved: 'Active', paused: 'Paused', rejected: 'Rejected' } as const;
const REQ_TONE = { open: 'gold', matched: 'ok', closed: 'mute', declined: 'bad' } as const;
const REQ_LABEL = { open: 'Open', matched: 'Matched', closed: 'Closed', declined: 'Declined' } as const;

const actionBtn =
  'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition disabled:opacity-40';

export function MentorshipAdmin({ mentors, requests, mentorAccounts }: { mentors: MentorRow[]; requests: RequestRow[]; mentorAccounts: Record<string, string> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [choice, setChoice] = useState<Record<string, string>>({});
  const [declining, setDeclining] = useState<RequestRow | null>(null);
  const [note, setNote] = useState('');

  const run = async (key: string, url: string, method: 'PATCH' | 'POST', body: unknown, success: string) => {
    setBusy(key);
    const res = await api(url, { method, body });
    setBusy(null);
    if (!res.ok) {
      toast(res.error ?? 'Action failed');
      return false;
    }
    toast(success);
    router.refresh();
    return true;
  };

  /** Mentors who can take this request: active, a free spot, not the requester. Preferred first. */
  const candidates = (r: RequestRow) =>
    mentors
      .filter((m) => m.status === 'approved' && m.active < m.capacity && mentorAccounts[m.id] !== r.accountId)
      .sort((a, b) => Number(b.id === r.preferredMentorId) - Number(a.id === r.preferredMentorId) || a.active / a.capacity - b.active / b.capacity);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Mentorship requests</h2>
        <DataTable label="Mentorship requests">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Stage &amp; goals</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right">
                Match
              </th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && <EmptyRow colSpan={4}>No mentorship requests yet.</EmptyRow>}
            {requests.map((r) => {
              const options = r.status === 'open' ? candidates(r) : [];
              const selected = choice[r.id] ?? options[0]?.id ?? '';
              return (
                <tr key={r.id}>
                  <td className="max-w-[220px]">
                    <span className="block truncate font-medium text-[var(--fg)]">{r.name}</span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">{r.email}</span>
                    <span className="block text-[11.5px] text-[var(--muted)]">{formatDateTime(r.createdAt)}</span>
                  </td>
                  <td className="max-w-[420px]">
                    <span className="block text-[13px] font-medium text-[var(--fg)]">{r.stage}</span>
                    <span className="line-clamp-3 block text-[12.5px] text-[var(--muted)]">{r.goals}</span>
                    {r.wings.length > 0 && <span className="mt-1 block text-[11.5px] text-[var(--muted)]">{r.wings.join(' · ')}</span>}
                    {r.preferredMentor && <span className="mt-1 block text-[11.5px] text-gold">Prefers {r.preferredMentor}</span>}
                    {r.adminNote && <span className="mt-1 block text-[11.5px] text-[var(--muted)]">Note: {r.adminNote}</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    <Chip tone={REQ_TONE[r.status]}>{REQ_LABEL[r.status]}</Chip>
                    {r.mentorName && <span className="mt-1 block text-[12px] text-[var(--muted)]">with {r.mentorName}</span>}
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {r.status === 'open' &&
                        (options.length ? (
                          <>
                            <select
                              aria-label={`Mentor for ${r.name}`}
                              value={selected}
                              onChange={(e) => setChoice({ ...choice, [r.id]: e.target.value })}
                              className="h-8 max-w-[200px] rounded-full border border-mist/[0.14] bg-field/80 px-3 text-[12px] text-[var(--fg)]"
                            >
                              {options.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.active}/{m.capacity})
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={busy === r.id || !selected}
                              onClick={() =>
                                void run(r.id, '/api/mentorship/match', 'POST', { requestId: r.id, mentorId: selected }, `${r.name} matched — both have been emailed`)
                              }
                              className={`${actionBtn} border-ok/30 bg-ok/10 text-ok hover:bg-ok/20`}
                            >
                              <HeartHandshake className="h-3.5 w-3.5" aria-hidden /> Match
                            </button>
                          </>
                        ) : (
                          <span className="text-[12px] text-[var(--muted)]">No mentor with a free spot</span>
                        ))}
                      {r.status === 'open' && (
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => {
                            setNote('');
                            setDeclining(r);
                          }}
                          className={`${actionBtn} border-bad/30 text-bad hover:bg-bad/10`}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden /> Decline
                        </button>
                      )}
                      {r.status === 'matched' && (
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void run(r.id, '/api/mentorship/requests', 'PATCH', { id: r.id, status: 'closed', note: 'Mentorship completed' }, 'Match closed — the mentor’s spot is free again')}
                          className={`${actionBtn} border-mist/[0.16] text-[var(--fg)] hover:bg-mist/[0.06]`}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden /> Close match
                        </button>
                      )}
                      {(r.status === 'declined' || r.status === 'closed') && (
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void run(r.id, '/api/mentorship/requests', 'PATCH', { id: r.id, status: 'open', note: '' }, 'Request re-opened')}
                          className={`${actionBtn} border-mist/[0.16] text-[var(--muted)] hover:text-[var(--fg)]`}
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Re-open
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </section>

      <section>
        <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Mentors</h2>
        <DataTable label="Mentors">
          <thead>
            <tr>
              <th scope="col">Mentor</th>
              <th scope="col">Expertise</th>
              <th scope="col">Mentees</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {mentors.length === 0 && <EmptyRow colSpan={5}>No mentor applications yet.</EmptyRow>}
            {mentors.map((m) => (
              <tr key={m.id}>
                <td className="max-w-[260px]">
                  <span className="block truncate font-medium text-[var(--fg)]">{m.name}</span>
                  <span className="block truncate text-[12px] text-[var(--muted)]">{m.email}</span>
                  <span className="block truncate text-[12px] text-[var(--muted)]">{m.headline}</span>
                </td>
                <td className="max-w-[320px]">
                  <span className="block text-[12.5px] text-[var(--fg)]">{m.expertise.join(' · ')}</span>
                  {m.wings.length > 0 && <span className="block text-[11.5px] text-[var(--muted)]">{m.wings.join(' · ')}</span>}
                  <span className="block text-[11.5px] text-[var(--muted)]">
                    {m.modes.join(' / ')}
                    {m.city ? ` · ${m.city}` : ''}
                  </span>
                </td>
                <td className="whitespace-nowrap font-mono text-[13px]">
                  {m.active}/{m.capacity}
                </td>
                <td>
                  <Chip tone={MENTOR_TONE[m.status]}>{MENTOR_LABEL[m.status]}</Chip>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    {m.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={busy === m.id}
                        onClick={() => void run(m.id, '/api/mentorship/mentors', 'PATCH', { id: m.id, status: 'approved' }, `${m.name} is an active mentor`)}
                        className={`${actionBtn} border-ok/30 bg-ok/10 text-ok hover:bg-ok/20`}
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden /> Approve
                      </button>
                    )}
                    {m.status === 'approved' && (
                      <button
                        type="button"
                        disabled={busy === m.id}
                        onClick={() => void run(m.id, '/api/mentorship/mentors', 'PATCH', { id: m.id, status: 'paused' }, `${m.name} paused`)}
                        className={`${actionBtn} border-mist/[0.16] text-[var(--fg)] hover:bg-mist/[0.06]`}
                      >
                        <Pause className="h-3.5 w-3.5" aria-hidden /> Pause
                      </button>
                    )}
                    {m.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busy === m.id}
                        onClick={() => void run(m.id, '/api/mentorship/mentors', 'PATCH', { id: m.id, status: 'rejected' }, `${m.name} not approved`)}
                        className={`${actionBtn} border-bad/30 text-bad hover:bg-bad/10`}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden /> Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>

      <ConfirmDialog
        open={declining !== null}
        title="Decline this request?"
        description={declining ? `${declining.name} will see the request as not matched in their dashboard, with your note.` : ''}
        confirmLabel="Decline request"
        danger
        busy={!!declining && busy === declining.id}
        onClose={() => setDeclining(null)}
        onConfirm={async () => {
          if (!declining) return;
          const ok = await run(declining.id, '/api/mentorship/requests', 'PATCH', { id: declining.id, status: 'declined', note }, 'Request declined');
          if (ok) setDeclining(null);
        }}
      >
        <TextAreaField label="Note to the member (optional)" value={note} onChange={setNote} maxLength={500} rows={3} />
      </ConfirmDialog>
    </div>
  );
}
