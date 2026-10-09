'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarPlus, Copy, Loader2, Printer, RefreshCw } from 'lucide-react';
import { cn, useToast } from '@ascend/ui';
import { trackEvent } from '../site/Providers';
import { buildIcs, type IcsInput } from './event-time';
import { payWithRazorpay, type PaymentInit } from './razorpay-client';

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

export interface RetryPaymentProps {
  bookingId: string;
  accessToken: string;
  eventSlug: string;
  eventTitle: string;
  siteName: string;
  feeLabel: string;
  fee: number;
  prefill: { name?: string; email?: string; contact?: string };
}

/** Starts a fresh payment for a pending or failed registration (same booking). */
export function RetryPaymentButton(props: RetryPaymentProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async () => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/registrations/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: props.bookingId, accessToken: props.accessToken }),
      });
      const data = (await res.json().catch(() => ({}))) as { payment?: PaymentInit; error?: string; paymentStatus?: string };
      if (data.paymentStatus === 'paid') {
        router.refresh();
        return;
      }
      if (!res.ok || !data.payment) {
        setMessage(data.error || 'Could not start the payment. Please try again.');
        return;
      }
      if (data.payment.provider !== 'razorpay') {
        setMessage(data.payment.provider === 'error' ? data.payment.message : 'Online payment is not enabled yet.');
        return;
      }
      const outcome = await payWithRazorpay({
        bookingId: props.bookingId,
        accessToken: props.accessToken,
        payment: data.payment,
        siteName: props.siteName,
        description: props.eventTitle,
        prefill: props.prefill,
      });
      if (outcome.kind === 'paid') {
        trackEvent('payment_success', { event_slug: props.eventSlug, value: props.fee, currency: 'INR', transaction_id: props.bookingId });
      } else if (outcome.kind === 'failed') {
        setMessage(outcome.message);
      }
      router.refresh();
    } catch {
      setMessage('Network error. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 print:hidden">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="inline-flex h-12 w-fit items-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white shadow-[0_14px_36px_-12px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-wait disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
        {busy ? 'Opening checkout…' : `Pay ${props.feeLabel} now`}
      </button>
      <div aria-live="polite">
        {message && (
          <p className="flex items-start gap-2 text-[14px] text-bad">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {message}
          </p>
        )}
      </div>
    </div>
  );
}
