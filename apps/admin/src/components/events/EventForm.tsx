'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GripVertical, Plus, Save, Trash2, X } from 'lucide-react';
import { EVENT_CATEGORIES, ORG_WINGS, type CommunityAgendaItem, type CommunityEvent } from '@ascend/shared';
import { Button, cn, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { slugify } from '../../lib/format';
import { Panel } from '../ui/Display';
import {
  ConfirmDialog,
  ImageUpload,
  SearchInput,
  SelectField,
  Switch,
  TextAreaField,
  TextField,
} from '../ui/Controls';

export interface SpeakerOption {
  slug: string;
  name: string;
  title?: string;
}

interface FormState {
  title: string;
  slug: string;
  category: string;
  wingNumber: string;
  date: string;
  time: string;
  endTime: string;
  mode: 'Online' | 'Offline';
  venue: string;
  city: string;
  mapUrl: string;
  fee: string;
  memberFee: string;
  seatsTotal: string;
  cpeHours: string;
  speakerSlugs: string[];
  description: string;
  agenda: CommunityAgendaItem[];
  terms: string;
  imageUrl: string;
  registrationOpen: boolean;
  featured: boolean;
  isPublished: boolean;
}

function toState(e?: CommunityEvent): FormState {
  return {
    title: e?.title ?? '',
    slug: e?.slug ?? '',
    category: e?.category ?? EVENT_CATEGORIES[0],
    wingNumber: String(e?.wingNumber ?? ORG_WINGS[0]!.number),
    date: e?.date ?? '',
    time: e?.time ?? '',
    endTime: e?.endTime ?? '',
    mode: e?.mode ?? 'Offline',
    venue: e?.venue ?? '',
    city: e?.city ?? '',
    mapUrl: e?.mapUrl ?? '',
    fee: String(e?.fee ?? 0),
    memberFee: String(e?.memberFee ?? 0),
    seatsTotal: String(e?.seatsTotal ?? 100),
    cpeHours: e?.cpeHours ? String(e.cpeHours) : '',
    speakerSlugs: e?.speakerSlugs ?? [],
    description: e?.description ?? '',
    agenda: e?.agenda ?? [],
    terms: e?.terms ?? '',
    imageUrl: e?.imageUrl ?? '',
    registrationOpen: e?.registrationOpen !== false,
    featured: Boolean(e?.featured),
    isPublished: e ? e.isPublished !== false : false,
  };
}

function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || 'event';
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

export function EventForm({
  event,
  speakers,
  takenSlugs,
}: {
  event?: CommunityEvent;
  speakers: SpeakerOption[];
  /** Slugs used by other events. */
  takenSlugs: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(event);
  const [form, setForm] = useState<FormState>(() => toState(event));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Email registered attendees when the date, time or venue changes. */
  const [notifyAttendees, setNotifyAttendees] = useState(true);
  const [speakerQuery, setSpeakerQuery] = useState('');
  const taken = useMemo(() => new Set(takenSlugs), [takenSlugs]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'title' && !slugTouched) next.slug = uniqueSlug(slugify(String(value)), taken);
      return next;
    });
    if (errors[key as string]) setErrors(({ [key as string]: _drop, ...rest }) => rest);
  };

  const filteredSpeakers = useMemo(() => {
    const q = speakerQuery.trim().toLowerCase();
    return q ? speakers.filter((s) => `${s.name} ${s.title ?? ''}`.toLowerCase().includes(q)) : speakers;
  }, [speakers, speakerQuery]);

  const toggleSpeaker = (slug: string) =>
    set('speakerSlugs', form.speakerSlugs.includes(slug) ? form.speakerSlugs.filter((s) => s !== slug) : [...form.speakerSlugs, slug]);

  const setAgenda = (index: number, patch: Partial<CommunityAgendaItem>) =>
    set(
      'agenda',
      form.agenda.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) e.slug = 'Use lowercase letters, numbers and hyphens only';
    else if (taken.has(form.slug)) e.slug = 'Another event already uses this slug';
    if (!form.date) e.date = 'Event date is required';
    if (!form.time.trim()) e.time = 'Start time is required';
    if (!form.venue.trim()) e.venue = form.mode === 'Online' ? 'Platform / link label is required' : 'Venue is required';
    if (form.mode === 'Offline' && !form.city.trim()) e.city = 'City is required for offline events';
    if (form.mapUrl && !/^https?:\/\/\S+$/i.test(form.mapUrl)) e.mapUrl = 'Enter a full URL starting with https://';
    const fee = Number(form.fee);
    const memberFee = Number(form.memberFee);
    const seats = Number(form.seatsTotal);
    if (!Number.isFinite(fee) || fee < 0) e.fee = 'Enter 0 or a positive amount';
    if (!Number.isFinite(memberFee) || memberFee < 0) e.memberFee = 'Enter 0 or a positive amount';
    else if (memberFee > fee) e.memberFee = 'Member fee should not exceed the standard fee';
    if (!Number.isInteger(seats) || seats < 0) e.seatsTotal = 'Enter a whole number of seats';
    if (form.cpeHours.trim() !== '') {
      const h = Number(form.cpeHours);
      if (!Number.isFinite(h) || h < 0 || h > 100) e.cpeHours = 'Enter hours between 0 and 100';
    }
    else if (event && seats < (Number(event.seatsTaken) || 0)) {
      e.seatsTotal = `Capacity cannot be below the ${event.seatsTaken} seats already taken`;
    }
    if (!form.description.trim()) e.description = 'Description is required';
    form.agenda.forEach((row, i) => {
      if (!row.title.trim()) e[`agenda.${i}.title`] = 'Each agenda row needs a title';
    });
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      toast('Please fix the highlighted fields');
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.focus();
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      wingNumber: Number(form.wingNumber),
      fee: Number(form.fee),
      memberFee: Number(form.memberFee),
      seatsTotal: Number(form.seatsTotal),
      cpeHours: form.cpeHours.trim() === '' ? 0 : Number(form.cpeHours),
      agenda: form.agenda.map((a) => ({ time: a.time.trim(), title: a.title.trim(), speaker: a.speaker?.trim() || undefined })),
    };
    const res = isEdit
      ? await api<CommunityEvent>('/api/community', { method: 'PUT', body: { type: 'events', id: event!.id, updates: payload, notifyAttendees } })
      : await api<CommunityEvent>('/api/community', { method: 'POST', body: { type: 'events', item: payload } });
    setSaving(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast(res.error ?? 'Could not save the event');
      return;
    }
    const notified = Number(res.raw?.notified) || 0;
    toast(isEdit ? (notified ? `Event saved — ${notified} registered attendee${notified === 1 ? '' : 's'} emailed about the change` : 'Event saved') : 'Event created');
    if (!isEdit && res.data?.id) router.push(`/events/${res.data.id}`);
    router.refresh();
  };

  const remove = async () => {
    if (!event) return;
    setDeleting(true);
    const res = await api(`/api/community?type=events&id=${encodeURIComponent(event.id)}`, { method: 'DELETE' });
    setDeleting(false);
    if (!res.ok) {
      setConfirmDelete(false);
      toast(res.error ?? 'Could not delete the event');
      return;
    }
    toast('Event deleted');
    router.push('/events');
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Event details">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <TextField label="Title" required value={form.title} onChange={(v) => set('title', v)} error={errors.title} maxLength={200} className="md:col-span-2" />
              <TextField
                label="URL slug"
                required
                value={form.slug}
                onChange={(v) => {
                  setSlugTouched(true);
                  set('slug', slugify(v));
                }}
                error={errors.slug}
                hint={`Event page: /events/${form.slug || 'your-slug'}`}
              />
              <SelectField
                label="Category"
                required
                value={form.category}
                onChange={(v) => set('category', v)}
                options={[
                  ...EVENT_CATEGORIES.map((c) => ({ value: c, label: c })),
                  ...((EVENT_CATEGORIES as readonly string[]).includes(form.category) ? [] : [{ value: form.category, label: form.category }]),
                ]}
                error={errors.category}
              />
              <SelectField
                label="Wing"
                required
                value={form.wingNumber}
                onChange={(v) => set('wingNumber', v)}
                options={ORG_WINGS.map((w) => ({ value: String(w.number), label: `${w.number}. ${w.name}` }))}
                error={errors.wingNumber}
                className="md:col-span-2"
              />
              <TextAreaField
                label="Description"
                required
                rows={6}
                value={form.description}
                onChange={(v) => set('description', v)}
                error={errors.description}
                className="md:col-span-2"
                hint="Plain text; blank lines separate paragraphs."
              />
            </div>
          </Panel>

          <Panel title="Date & venue">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <TextField label="Date" type="date" required value={form.date} onChange={(v) => set('date', v)} error={errors.date} />
              <TextField label="Start time" required value={form.time} onChange={(v) => set('time', v)} error={errors.time} placeholder="10:00 AM" />
              <TextField label="End time" value={form.endTime} onChange={(v) => set('endTime', v)} error={errors.endTime} placeholder="5:00 PM" />
              <SelectField
                label="Mode"
                required
                value={form.mode}
                onChange={(v) => set('mode', v as FormState['mode'])}
                options={[
                  { value: 'Offline', label: 'Offline (in person)' },
                  { value: 'Online', label: 'Online' },
                ]}
              />
              <TextField
                label={form.mode === 'Online' ? 'Platform' : 'Venue'}
                required
                value={form.venue}
                onChange={(v) => set('venue', v)}
                error={errors.venue}
                placeholder={form.mode === 'Online' ? 'Zoom webinar' : 'Bharat Mandapam'}
              />
              <TextField label="City" required={form.mode === 'Offline'} value={form.city} onChange={(v) => set('city', v)} error={errors.city} />
              <TextField
                label="Google Maps link"
                type="url"
                value={form.mapUrl}
                onChange={(v) => set('mapUrl', v)}
                error={errors.mapUrl}
                placeholder="https://maps.google.com/…"
                className="md:col-span-3"
              />
            </div>
          </Panel>

          <Panel title="Tickets & capacity">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <TextField label="Standard fee (₹)" type="number" min={0} inputMode="decimal" required value={form.fee} onChange={(v) => set('fee', v)} error={errors.fee} hint="0 = free" />
              <TextField label="Member fee (₹)" type="number" min={0} inputMode="decimal" required value={form.memberFee} onChange={(v) => set('memberFee', v)} error={errors.memberFee} />
              <TextField
                label="Seat capacity"
                type="number"
                min={0}
                inputMode="numeric"
                required
                value={form.seatsTotal}
                onChange={(v) => set('seatsTotal', v)}
                error={errors.seatsTotal}
                hint={event ? `${event.seatsTaken ?? 0} seats taken` : undefined}
              />
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <TextField
                label="CPE / learning hours"
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                value={form.cpeHours}
                onChange={(v) => set('cpeHours', v)}
                error={errors.cpeHours}
                hint="Optional — printed on attendees’ certificates. Leave empty if not applicable."
              />
            </div>
          </Panel>

          <Panel
            title="Agenda"
            description="Session-wise schedule shown on the event page"
            actions={
              <Button type="button" variant="line" size="sm" onClick={() => set('agenda', [...form.agenda, { time: '', title: '', speaker: '' }])}>
                <Plus className="h-4 w-4" aria-hidden />
                Add session
              </Button>
            }
          >
            {form.agenda.length === 0 ? (
              <p className="py-4 text-center text-[13.5px] text-[var(--muted)]">No sessions yet. Add the first one.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {form.agenda.map((row, i) => (
                  <li key={i} className="grid grid-cols-1 gap-3 rounded-2xl border border-mist/[0.08] bg-mist/[0.02] p-3 sm:grid-cols-[auto_120px_1fr_1fr_auto] sm:items-end">
                    <span aria-hidden className="hidden h-11 items-center text-faint sm:flex">
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <TextField label={`Session ${i + 1} time`} value={row.time} onChange={(v) => setAgenda(i, { time: v })} placeholder="10:30 AM" />
                    <TextField label="Session title" required value={row.title} onChange={(v) => setAgenda(i, { title: v })} error={errors[`agenda.${i}.title`]} />
                    <TextField label="Speaker" value={row.speaker ?? ''} onChange={(v) => setAgenda(i, { speaker: v })} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => set('agenda', form.agenda.filter((_, idx) => idx !== i))}
                      className="justify-self-end"
                    >
                      <X className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Remove session {i + 1}</span>
                    </Button>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          <Panel title="Terms & conditions">
            <TextAreaField label="Terms" rows={5} value={form.terms} onChange={(v) => set('terms', v)} error={errors.terms} hint="Cancellation, refund and attendance terms for this event." />
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Panel title="Visibility">
            <div className="flex flex-col gap-3">
              <Switch checked={form.isPublished} onChange={(v) => set('isPublished', v)} label="Published" description="Show this event on the website" />
              <Switch
                checked={form.registrationOpen}
                onChange={(v) => set('registrationOpen', v)}
                label="Registrations open"
                description="Allow new bookings"
              />
              <Switch checked={form.featured} onChange={(v) => set('featured', v)} label="Featured" description="Highlight on the homepage" />
            </div>
          </Panel>

          <Panel title="Banner">
            <ImageUpload label="Event banner" value={form.imageUrl} onChange={(v) => set('imageUrl', v)} error={errors.imageUrl} />
          </Panel>

          <Panel title="Speakers" description={`${form.speakerSlugs.length} selected`}>
            <div className="flex flex-col gap-3">
              {speakers.length > 6 && <SearchInput value={speakerQuery} onChange={setSpeakerQuery} placeholder="Find a speaker" label="Find a speaker" />}
              {speakers.length === 0 ? (
                <p className="text-[13px] text-[var(--muted)]">Add speakers under Website content → Speakers first.</p>
              ) : (
                <fieldset className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto pr-1">
                  <legend className="sr-only">Event speakers</legend>
                  {filteredSpeakers.map((s) => {
                    const checked = form.speakerSlugs.includes(s.slug);
                    return (
                      <label
                        key={s.slug}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                          checked ? 'border-brand-300/40 bg-brand-500/10' : 'border-mist/[0.08] hover:border-mist/[0.18]'
                        )}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleSpeaker(s.slug)} className="h-4 w-4 accent-[var(--lime)]" />
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-medium text-[var(--fg)]">{s.name}</span>
                          {s.title && <span className="block truncate text-[12px] text-[var(--muted)]">{s.title}</span>}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-token-lg border border-mist/[0.12] bg-panel/90 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {isEdit && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-bad">
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete event
            </Button>
          )}
          {isEdit && (
            <label className="flex cursor-pointer items-center gap-2 px-2 text-[12.5px] text-[var(--muted)]">
              <input type="checkbox" checked={notifyAttendees} onChange={(e) => setNotifyAttendees(e.target.checked)} className="h-4 w-4 accent-[var(--lime)]" />
              Email registered attendees if the date, time or venue changes
            </label>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="line" size="sm" onClick={() => router.push('/events')}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={saving}>
            {!saving && <Save className="h-4 w-4" aria-hidden />}
            {isEdit ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this event?"
        description={`"${form.title}" will be removed from the website permanently. Events with active registrations cannot be deleted — unpublish them instead.`}
        confirmLabel="Delete event"
        danger
        busy={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </form>
  );
}
