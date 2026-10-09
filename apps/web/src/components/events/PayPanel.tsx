'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CreditCard, Loader2, Lock } from 'lucide-react';
import { cn } from '@ascend/ui';
import { trackEvent } from '../site/Providers';
import { loginUrl } from '../../lib/member-session';
import { payWithRazorpay, type PaymentInit } from './razorpay-client';

export interface PayPanelProps {
  bookingId: string;
  accessToken: string;
  eventSlug: string;
  eventTitle: string;
  siteName: string;
  fee: number;
  feeLabel: string;
  prefill: { name?: string; email?: string; contact?: string };
}

type State =
  | { kind: 'idle' }
  | { kind: 'opening' }
  | { kind: 'verifying' }
  | { kind: 'dismissed' }
  | { kind: 'error'; message: string };

const receiptUrl = (bookingId: string, token: string) =>
  `/registration/${encodeURIComponent(bookingId)}?t=${encodeURIComponent(token)}`;

/** Pay button on the payment page: creates a fresh Razorpay order and opens Checkout. */
export function PayPanel(props: PayPanelProps) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle' });
  const receipt = receiptUrl(props.bookingId, props.accessToken);

  const pay = async () => {
    setState({ kind: 'opening' });
    try {
      const res = await fetch('/api/registrations/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: props.bookingId, accessToken: props.accessToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        payment?: PaymentInit;
        error?: string;
        paymentStatus?: string;
        loginRequired?: boolean;
      };
      if (data.loginRequired) {
        router.push(loginUrl(`${window.location.pathname}${window.location.search}`));
        return;
      }
      if (data.paymentStatus === 'paid') {
        router.push(receipt);
        return;
      }
      if (!res.ok || !data.payment) {
        setState({ kind: 'error', message: data.error || 'Could not start the payment. Please try again.' });
        return;
      }
      if (data.payment.provider !== 'razorpay') {
        setState({
          kind: 'error',
          message: data.payment.provider === 'error' ? data.payment.message : 'Online payment is not enabled yet.',
        });
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
        setState({ kind: 'verifying' });
        trackEvent('payment_success', {
          event_slug: props.eventSlug,
          value: props.fee,
          currency: 'INR',
          transaction_id: props.bookingId,
        });
        router.push(receipt);
      } else if (outcome.kind === 'failed') {
        setState({ kind: 'error', message: outcome.message });
      } else {
        setState({ kind: 'dismissed' });
      }
    } catch {
      setState({ kind: 'error', message: 'Network error. Check your connection and retry.' });
    }
  };

  const busy = state.kind === 'opening' || state.kind === 'verifying';

  return (
    <div className="flex flex-col gap-4">
      <div aria-live="polite">
        {(state.kind === 'error' || state.kind === 'dismissed') && (
          <p
            role="alert"
            className={cn(
              'flex items-start gap-2 rounded-2xl border px-4 py-3 text-[14px]',
              state.kind === 'dismissed' ? 'border-warn/30 bg-warn/10 text-warn' : 'border-bad/30 bg-bad/10 text-bad'
            )}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {state.kind === 'dismissed'
              ? 'Payment not completed. Your seat is confirmed only after the payment goes through.'
              : state.message}{' '}
            Your registration is saved.
          </p>
        )}
        {state.kind === 'verifying' && (
          <p className="inline-flex items-center gap-2 text-[15px] text-ok">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Payment received — confirming…
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="btn-shimmer group inline-flex h-14 w-full items-center justify-between gap-2 rounded-full bg-grad-primary pl-6 pr-2 text-[16px] font-semibold text-white shadow-[0_14px_36px_-12px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-[340px]"
      >
        <span className="inline-flex items-center gap-2">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <CreditCard className="h-5 w-5" aria-hidden />}
          {state.kind === 'opening'
            ? 'Opening secure checkout…'
            : state.kind === 'verifying'
              ? 'Confirming…'
              : state.kind === 'idle'
                ? `Pay ${props.feeLabel} securely`
                : `Try again · ${props.feeLabel}`}
        </span>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
          <ArrowRight className="h-5 w-5" aria-hidden />
        </span>
      </button>
      <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Processed securely by Razorpay. We never see your UPI PIN or card details.
      </p>
    </div>
  );
}
