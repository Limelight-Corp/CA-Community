'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, CalendarDays, Clock, Download, Hourglass, Loader2, ShieldCheck, Ticket } from 'lucide-react';
import { cn } from '@ascend/ui';

interface CertItem {
  bookingId: string;
  eventTitle: string;
  eventSlug: string;
  dateLabel: string;
  cpeHours?: number;
  status: 'ready' | 'awaiting_event' | 'not_checked_in' | 'not_eligible';
  certificateId?: string;
  downloadUrl?: string;
  verifyPath?: string;
}

const STATUS_COPY: Record<CertItem['status'], string> = {
  ready: 'Ready to download',
  awaiting_event: 'Available after the event, once you are checked in',
  not_checked_in: 'Not issued — attendance was not recorded. Contact us if you attended.',
  not_eligible: 'Certificates are issued for confirmed bookings',
};

/** Bookings remembered on this device (saved by the booking page) → their certificates. */
function rememberedBookings(): { bookingId: string; accessToken: string }[] {
  const out: { bookingId: string; accessToken: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('ascend:booking:')) continue;
      const v = JSON.parse(localStorage.getItem(key) ?? 'null') as { bookingId?: string; accessToken?: string } | null;
      if (v?.bookingId && v.accessToken) out.push({ bookingId: v.bookingId, accessToken: v.accessToken });
    }
  } catch {
    /* storage unavailable */
  }
  return out.slice(0, 30);
}

export function MyCertificates() {
  const [items, setItems] = useState<CertItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const bookings = rememberedBookings();
    if (!bookings.length) {
      setItems([]);
      return;
    }
    fetch('/api/certificates/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: bookings }),
    })
      .then((r) => r.json())
      .then((d) => setItems((d.items as CertItem[]) ?? []))
      .catch(() => setError('Could not load your certificates. Please try again.'));
  }, []);

  const ready = items?.filter((i) => i.status === 'ready') ?? [];
  const totalHours = ready.reduce((n, i) => n + (i.cpeHours ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[22px] font-medium text-[var(--fg)]">My Certificates</h2>
        <p className="text-[14px] text-[var(--muted)]">
          Certificates are issued when you are checked in at an event. Each PDF has a QR code anyone can scan to verify it.
        </p>
      </div>

      {items && ready.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:max-w-[420px]">
          <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-4">
            <p className="text-[12px] text-[var(--muted)]">Certificates</p>
            <p className="font-display text-[32px] font-semibold leading-none text-[var(--fg)]">{ready.length}</p>
          </div>
          {totalHours > 0 && (
            <div className="rounded-2xl border border-mist/[0.12] bg-mist/[0.03] p-4">
              <p className="text-[12px] text-[var(--muted)]">CPE / learning hours</p>
              <p className="font-display text-[32px] font-semibold leading-none text-[var(--fg)]">{totalHours}</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-[14px] text-bad">{error}</p>}

      {!items && !error && (
        <p className="inline-flex items-center gap-2 text-[14px] text-[var(--muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading your certificates…
        </p>
      )}

      {items && items.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-[22px] border border-dashed border-mist/[0.16] p-6">
          <Award className="h-8 w-8 text-gold" aria-hidden />
          <p className="text-[15px] text-[var(--fg)]">No bookings found on this device yet.</p>
          <p className="text-[13.5px] text-[var(--muted)]">
            Register for an event — after you attend, your certificate appears here and on your booking page.
          </p>
          <Link href="/events" className="inline-flex h-10 items-center gap-2 rounded-full bg-grad-primary px-4 text-[13.5px] font-semibold text-white">
            <Ticket className="h-4 w-4" aria-hidden /> Browse events
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="grid gap-3">
          {items.map((c) => (
            <li
              key={c.bookingId}
              className={cn(
                'flex flex-col gap-4 rounded-[22px] border p-5 sm:flex-row sm:items-center sm:justify-between',
                c.status === 'ready' ? 'border-gold/30 bg-gold/[0.05]' : 'border-mist/[0.1] bg-mist/[0.02]'
              )}
            >
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className={cn(
                    'grid h-12 w-12 shrink-0 place-items-center rounded-2xl',
                    c.status === 'ready' ? 'bg-grad-gold text-brand-950' : 'bg-mist/[0.08] text-[var(--muted)]'
                  )}
                >
                  {c.status === 'ready' ? <Award className="h-6 w-6" aria-hidden /> : <Hourglass className="h-5 w-5" aria-hidden />}
                </span>
                <div className="min-w-0">
                  <Link href={`/events/${c.eventSlug}`} className="block truncate font-display text-[18px] font-medium text-[var(--fg)] hover:text-gold-soft">
                    {c.eventTitle}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--muted)]">
                    {c.dateLabel && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {c.dateLabel}
                      </span>
                    )}
                    {c.cpeHours && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden /> {c.cpeHours} CPE / learning hrs
                      </span>
                    )}
                    {c.certificateId && <span className="font-mono">{c.certificateId}</span>}
                  </p>
                  <p className="mt-1 text-[12.5px] text-[var(--fg-soft)]">{STATUS_COPY[c.status]}</p>
                </div>
              </div>
              {c.status === 'ready' && c.downloadUrl && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a href={c.downloadUrl} className="inline-flex h-10 items-center gap-2 rounded-full bg-grad-gold px-4 text-[13.5px] font-semibold text-brand-950 hover:brightness-105">
                    <Download className="h-4 w-4" aria-hidden /> PDF
                  </a>
                  <Link
                    href={c.verifyPath!}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.18] px-4 text-[13.5px] font-semibold text-[var(--fg)] hover:border-mist/50"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden /> Verify
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
