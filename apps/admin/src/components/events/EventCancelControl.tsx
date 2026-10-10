'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, RotateCcw } from 'lucide-react';
import { useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { ConfirmDialog, TextAreaField } from '../ui/Controls';

/** "Cancel event" (emails everyone registered) and, for a cancelled event, "Undo cancellation". */
export function EventCancelControl({
  eventId,
  title,
  cancelledAt,
  activeRegistrations,
  paidRegistrations,
}: {
  eventId: string;
  title: string;
  cancelledAt?: string;
  activeRegistrations: number;
  paidRegistrations: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    setBusy(true);
    const res = await api(`/api/events/${encodeURIComponent(eventId)}/cancel`, { method: 'POST', body: { note: note.trim() || undefined } });
    setBusy(false);
    if (!res.ok) {
      toast(res.error ?? 'Could not cancel the event');
      return;
    }
    const n = Number(res.raw?.notified) || 0;
    setOpen(false);
    toast(n ? `Event cancelled — ${n} attendee${n === 1 ? '' : 's'} emailed` : 'Event cancelled');
    router.refresh();
  };

  const restore = async () => {
    setBusy(true);
    const res = await api(`/api/events/${encodeURIComponent(eventId)}/cancel`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      toast(res.error ?? 'Could not undo the cancellation');
      return;
    }
    toast('Cancellation undone — reopen registrations in the form if needed');
    router.refresh();
  };

  const btn =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] font-semibold transition disabled:opacity-60';

  if (cancelledAt) {
    return (
      <button type="button" onClick={restore} disabled={busy} className={`${btn} border-mist/[0.16] bg-mist/[0.04] text-[var(--fg)] hover:border-brand-300/50`}>
        <RotateCcw className="h-4 w-4 text-brand-200" aria-hidden />
        Undo cancellation
      </button>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${btn} border-bad/40 bg-bad/10 text-bad hover:bg-bad/20`}>
        <Ban className="h-4 w-4" aria-hidden />
        Cancel event
      </button>
      <ConfirmDialog
        open={open}
        title="Cancel this event?"
        description={`"${title}" will be marked cancelled on the website and registrations will close. ${
          activeRegistrations
            ? `${activeRegistrations} registered attendee${activeRegistrations === 1 ? '' : 's'} will be emailed.`
            : 'Nobody is registered yet.'
        }${
          paidRegistrations
            ? ` ${paidRegistrations} paid booking${paidRegistrations === 1 ? '' : 's'} are told the team will contact them about payment — refund them from Payments.`
            : ''
        }`}
        confirmLabel="Cancel event & notify"
        danger
        busy={busy}
        onConfirm={cancel}
        onClose={() => setOpen(false)}
      >
        <TextAreaField
          label="Message to attendees (optional)"
          hint="Shown on the event page and in the email, e.g. the reason or a new date."
          value={note}
          onChange={setNote}
          maxLength={600}
          rows={3}
        />
      </ConfirmDialog>
    </>
  );
}
