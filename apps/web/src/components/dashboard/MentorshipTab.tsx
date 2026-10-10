'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MENTORSHIP_STAGES } from '@ascend/shared';
import { cn, useToast } from '@ascend/ui';
import { HeartHandshake, Linkedin, Loader2, Lock, Mail, Pause, Phone, Play, Sparkles, UserRoundCheck, Users } from 'lucide-react';
import type { DashboardData, MentorshipData } from '../../lib/member-dashboard';

const panel = 'rounded-[28px] border border-mist/[0.1] bg-grad-surface p-6 sm:p-7';
const inputCls =
  'w-full rounded-2xl border border-mist/[0.12] bg-field/80 px-4 py-3 text-[14.5px] text-white outline-none transition placeholder:text-faint focus:border-brand-500 focus:shadow-[0_0_0_4px_rgb(var(--lime-rgb)/0.18)]';
const pillBtn =
  'inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.16] px-4 text-[13.5px] font-semibold text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10 disabled:opacity-60';
const primaryBtn =
  'inline-flex h-11 items-center gap-2 rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white disabled:opacity-60';

const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Waiting for a match', cls: 'border-gold/40 bg-gold/10 text-gold' },
  matched: { label: 'Matched', cls: 'border-ok/40 bg-ok/10 text-ok' },
  closed: { label: 'Closed', cls: 'border-mist/20 bg-mist/[0.06] text-[var(--muted)]' },
  declined: { label: 'Not matched', cls: 'border-bad/40 bg-bad/10 text-bad' },
};
const MENTOR_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Under review', cls: 'border-gold/40 bg-gold/10 text-gold' },
  approved: { label: 'Active mentor', cls: 'border-ok/40 bg-ok/10 text-ok' },
  paused: { label: 'Paused', cls: 'border-mist/20 bg-mist/[0.06] text-[var(--muted)]' },
  rejected: { label: 'Not approved', cls: 'border-bad/40 bg-bad/10 text-bad' },
};

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
  return { ok: res.ok, ...data };
}

function WingPicker({ options, value, onChange }: { options: { number: number; name: string }[]; value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((w) => {
        const on = value.includes(w.number);
        return (
          <button
            key={w.number}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((n) => n !== w.number) : [...value, w.number])}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12.5px] transition',
              on ? 'border-gold/60 bg-gold/15 text-gold' : 'border-mist/[0.14] text-[var(--muted)] hover:text-[var(--fg)]'
            )}
          >
            {w.name}
          </button>
        );
      })}
    </div>
  );
}

export function MentorshipTab({ data }: { data: DashboardData }) {
  const m = data.mentorship;
  if (!m) {
    return (
      <section className={cn(panel, 'flex flex-col items-start gap-4')}>
        <Lock className="h-6 w-6 text-gold" aria-hidden />
        <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Mentorship is a member benefit</h2>
        <p className="text-[14.5px] leading-relaxed text-[var(--muted)]">
          Find a mentor — or become one — through formats like Mentor Match, MentorHer and Teach &amp; Mentor. It opens as soon as your membership is
          active.
        </p>
        <Link href={data.membership ? '/dashboard' : '/join'} className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950">
          <Sparkles className="h-4 w-4" aria-hidden /> {data.membership ? 'Check my membership' : 'See membership plans'}
        </Link>
      </section>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <FindMentor m={m} />
      <BeAMentor m={m} />
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */

function FindMentor({ m }: { m: MentorshipData }) {
  const router = useRouter();
  const { toast } = useToast();
  const open = m.requests.find((r) => r.status === 'open');
  const matched = m.requests.filter((r) => r.status === 'matched');
  const [stage, setStage] = useState<string>(MENTORSHIP_STAGES[0]!);
  const [goals, setGoals] = useState('');
  const [wings, setWings] = useState<number[]>([]);
  const [preferred, setPreferred] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const choosable = m.mentors.filter((x) => !x.self && x.spotsLeft > 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const r = await send('/api/mentorship/requests', 'POST', { stage, goals, wings, preferredMentorId: preferred || undefined });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      toast(r.error || 'Could not send your request.');
      return;
    }
    toast('Request sent — we will match you with a mentor soon.');
    setGoals('');
    router.refresh();
  };
  const withdraw = async (id: string) => {
    setBusy(true);
    const r = await send(`/api/mentorship/requests?id=${encodeURIComponent(id)}`, 'DELETE');
    setBusy(false);
    toast(r.ok ? 'Request withdrawn' : r.error || 'Could not withdraw the request.');
    if (r.ok) router.refresh();
  };

  return (
    <section className={panel}>
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Mentor Match</p>
      <h2 className="mt-2 font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">Find a mentor</h2>

      {matched.map((r) => (
        <div key={r.id} className="mt-5 rounded-[22px] border border-ok/30 bg-ok/[0.06] p-5">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ok">
            <UserRoundCheck className="h-4 w-4" aria-hidden /> Your mentor
          </p>
          <p className="mt-2 font-display text-[20px] font-medium text-[var(--fg)]">{r.mentor?.name}</p>
          <p className="text-[13.5px] text-[var(--muted)]">{r.mentor?.headline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {r.mentor?.email && (
              <a href={`mailto:${r.mentor.email}`} className={pillBtn}>
                <Mail className="h-4 w-4" aria-hidden /> {r.mentor.email}
              </a>
            )}
            {r.mentor?.mobile && (
              <a href={`tel:${r.mentor.mobile}`} className={pillBtn}>
                <Phone className="h-4 w-4" aria-hidden /> {r.mentor.mobile}
              </a>
            )}
            {r.mentor?.linkedinUrl && (
              <a href={r.mentor.linkedinUrl} target="_blank" rel="noopener noreferrer" className={pillBtn}>
                <Linkedin className="h-4 w-4" aria-hidden /> LinkedIn
              </a>
            )}
          </div>
          <p className="mt-3 text-[12.5px] text-[var(--muted)]">Your goals: {r.goals}</p>
        </div>
      ))}

      {open ? (
        <div className="mt-5 flex flex-col gap-3 rounded-[22px] border border-gold/25 bg-gold/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-[var(--fg)]">
            Your request ({open.stage}) is with our team — we’ll introduce you to a mentor by email.
          </p>
          <button type="button" onClick={() => withdraw(open.id)} disabled={busy} className={pillBtn}>
            Withdraw
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-5" noValidate>
          <p className="text-[14px] text-[var(--muted)]">Tell us where you are and what you need — we’ll match you with an experienced member.</p>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">I am a…</span>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls}>
              {MENTORSHIP_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">What would you like help with?</span>
            <textarea
              rows={4}
              maxLength={1500}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. Choosing between articleship in audit and tax; preparing for my first industry interview…"
              className={cn(inputCls, 'resize-y')}
            />
            {errors.goals && <span className="text-[12px] text-bad">{errors.goals}</span>}
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Areas of interest (optional)</span>
            <WingPicker options={m.wingOptions} value={wings} onChange={setWings} />
          </div>
          {choosable.length > 0 && (
            <label className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-[var(--fg)]">Preferred mentor (optional)</span>
              <select value={preferred} onChange={(e) => setPreferred(e.target.value)} className={inputCls}>
                <option value="">No preference — match me</option>
                {choosable.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} — {x.headline}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" disabled={busy} className={cn(primaryBtn, 'justify-self-start')}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <HeartHandshake className="h-4 w-4" aria-hidden />} Request a mentor
          </button>
        </form>
      )}

      {m.mentors.length > 0 && (
        <details className="mt-6 rounded-[20px] border border-mist/[0.1] p-4">
          <summary className="cursor-pointer text-[13.5px] font-semibold text-[var(--fg)]">
            <Users className="mr-2 inline h-4 w-4 text-gold" aria-hidden />
            Our mentors ({m.mentors.length})
          </summary>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {m.mentors.map((x) => (
              <li key={x.id} className="rounded-2xl border border-mist/[0.1] p-4">
                <p className="font-medium text-[var(--fg)]">
                  {x.name} {x.self && <span className="text-[12px] text-[var(--muted)]">(you)</span>}
                </p>
                <p className="text-[12.5px] text-[var(--muted)]">{x.headline}</p>
                <p className="mt-2 text-[12.5px] text-[var(--fg-soft)]">{x.expertise.join(' · ')}</p>
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  {x.modes.join(' / ')}
                  {x.city ? ` · ${x.city}` : ''} · {x.spotsLeft > 0 ? `${x.spotsLeft} spot${x.spotsLeft === 1 ? '' : 's'} open` : 'Fully booked'}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */

function BeAMentor({ m }: { m: MentorshipData }) {
  const router = useRouter();
  const { toast } = useToast();
  const p = m.profile;
  const [editing, setEditing] = useState(!p);
  const [headline, setHeadline] = useState(p?.headline ?? '');
  const [expertise, setExpertise] = useState((p?.expertise ?? []).join(', '));
  const [wings, setWings] = useState<number[]>(p?.wings ?? []);
  const [modes, setModes] = useState<('Online' | 'In person')[]>(p?.modes ?? ['Online']);
  const [city, setCity] = useState(p?.city ?? '');
  const [capacity, setCapacity] = useState(p?.capacity ?? 2);
  const [bio, setBio] = useState(p?.bio ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(p?.linkedinUrl ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const r = await send('/api/mentorship/mentor', 'PUT', {
      headline,
      expertise: expertise.split(',').map((x) => x.trim()).filter(Boolean),
      wings,
      modes,
      city,
      capacity,
      bio,
      linkedinUrl,
    });
    setBusy(false);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      toast(r.error || 'Could not save your mentor profile.');
      return;
    }
    toast(p ? 'Mentor profile saved' : 'Thank you! Your mentor application is with our team.');
    setEditing(false);
    router.refresh();
  };
  const toggle = async (available: boolean) => {
    setBusy(true);
    const r = await send('/api/mentorship/mentor', 'PATCH', { available });
    setBusy(false);
    toast(r.ok ? (available ? 'You are taking mentees again' : 'Paused — no new mentees for now') : r.error || 'Could not update.');
    if (r.ok) router.refresh();
  };
  const st = p ? MENTOR_STATUS[p.status] : null;

  return (
    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Teach &amp; Mentor</p>
          <h2 className="mt-2 font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">Mentor others</h2>
          {p && (
            <p className="mt-1 text-[13px] text-[var(--muted)]">
              {p.activeMentees} of {p.capacity} mentee{p.capacity === 1 ? '' : 's'}
            </p>
          )}
        </div>
        {st && <span className={cn('rounded-full border px-3 py-1 text-[12.5px] font-semibold', st.cls)}>{st.label}</span>}
      </div>

      {p && !editing && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setEditing(true)} className={pillBtn}>
            Edit mentor profile
          </button>
          {p.status === 'approved' && (
            <button type="button" onClick={() => toggle(false)} disabled={busy} className={pillBtn}>
              <Pause className="h-4 w-4" aria-hidden /> Pause new mentees
            </button>
          )}
          {p.status === 'paused' && (
            <button type="button" onClick={() => toggle(true)} disabled={busy} className={pillBtn}>
              <Play className="h-4 w-4" aria-hidden /> Resume
            </button>
          )}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="mt-5 grid gap-5 sm:grid-cols-2" noValidate>
          {!p && (
            <p className="text-[14px] text-[var(--muted)] sm:col-span-2">
              Share your experience with students and young CAs. Our team reviews every mentor before the profile goes live for members.
            </p>
          )}
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Headline</span>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={160} placeholder="Partner, XYZ & Co · 12 years in direct tax" className={inputCls} />
            {errors.headline && <span className="text-[12px] text-bad">{errors.headline}</span>}
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Expertise (comma-separated)</span>
            <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Direct tax, Litigation, Career guidance" className={inputCls} />
            {errors.expertise && <span className="text-[12px] text-bad">{errors.expertise}</span>}
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Wings</span>
            <WingPicker options={m.wingOptions} value={wings} onChange={setWings} />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">I can mentor</span>
            <div className="flex gap-4">
              {(['Online', 'In person'] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-[14px] text-[var(--fg-soft)]">
                  <input
                    type="checkbox"
                    checked={modes.includes(mode)}
                    onChange={(e) => setModes(e.target.checked ? [...modes, mode] : modes.filter((x) => x !== mode))}
                    className="h-4 w-4 accent-[var(--lime)]"
                  />
                  {mode}
                </label>
              ))}
            </div>
            {errors.modes && <span className="text-[12px] text-bad">{errors.modes}</span>}
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Mentees at a time</span>
            <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={inputCls}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">City (for in-person)</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} className={inputCls} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">LinkedIn (optional)</span>
            <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/…" className={inputCls} />
            {errors.linkedinUrl && <span className="text-[12px] text-bad">{errors.linkedinUrl}</span>}
          </label>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">How you can help</span>
            <textarea rows={4} maxLength={1200} value={bio} onChange={(e) => setBio(e.target.value)} className={cn(inputCls, 'resize-y')} />
            {errors.bio && <span className="text-[12px] text-bad">{errors.bio}</span>}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {p ? 'Save mentor profile' : 'Apply to mentor'}
            </button>
            {p && (
              <button type="button" onClick={() => setEditing(false)} className={pillBtn}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {m.mentees.length > 0 && (
        <div className="mt-6">
          <h3 className="text-[14px] font-semibold text-[var(--fg)]">Your mentees</h3>
          <ul className="mt-3 grid gap-3">
            {m.mentees.map((x) => (
              <li key={x.id} className="rounded-2xl border border-mist/[0.1] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-[var(--fg)]">
                    {x.name} <span className="text-[12.5px] text-[var(--muted)]">· {x.stage}</span>
                  </p>
                  <span className={cn('rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold', REQUEST_STATUS[x.status]?.cls)}>
                    {x.status === 'matched' ? 'Active' : 'Completed'}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[var(--fg-soft)]">{x.goals}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a href={`mailto:${x.email}`} className={pillBtn}>
                    <Mail className="h-4 w-4" aria-hidden /> {x.email}
                  </a>
                  {x.mobile && (
                    <a href={`tel:${x.mobile}`} className={pillBtn}>
                      <Phone className="h-4 w-4" aria-hidden /> {x.mobile}
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
