'use client';

import React, { useEffect } from 'react';
import { CalendarPlus, Copy, Printer } from 'lucide-react';
import { cn, useToast } from '@ascend/ui';
import { buildIcs, type IcsInput } from './event-time';

const ghostBtn =
  'inline-flex h-12 items-center gap-2 rounded-full border border-mist/[0.16] px-5 text-[14.5px] font-semibold text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300';

export function PrintButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={cn(ghostBtn, className)}>
      <Printer className="h-4 w-4" aria-hidden /> Print / save PDF
    </button>
  );
}

export function AddToCalendarButton({ ics, fileName, className }: { ics: IcsInput; fileName: string; className?: string }) {
  const download = () => {
    const blob = new Blob([buildIcs(ics)], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${fileName.replace(/[^a-z0-9-]+/gi, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };
  return (
    <button type="button" onClick={download} className={cn(ghostBtn, className)}>
      <CalendarPlus className="h-4 w-4" aria-hidden /> Add to calendar
    </button>
  );
}

export function CopyBookingId({ bookingId }: { bookingId: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(bookingId);
          toast('Booking ID copied');
        } catch {
          toast('Could not copy — please note it down');
        }
      }}
      className="grid h-10 w-10 place-items-center rounded-full border border-mist/[0.16] text-[var(--fg)] transition hover:bg-mist/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 print:hidden"
      aria-label="Copy booking ID"
    >
      <Copy className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** Keeps a link to this booking on the device so the register page can point back to it. */
export function RememberBooking({ eventSlug, bookingId, accessToken }: { eventSlug: string; bookingId: string; accessToken: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(`ascend:booking:${eventSlug}`, JSON.stringify({ bookingId, accessToken }));
    } catch {
      /* storage unavailable */
    }
  }, [eventSlug, bookingId, accessToken]);
  return null;
}
