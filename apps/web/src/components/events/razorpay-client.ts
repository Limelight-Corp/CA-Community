'use client';

/** Payment instructions returned by /api/registrations and /api/registrations/retry. */
export type PaymentInit =
  | { provider: 'razorpay'; keyId: string; orderId: string; amount: number; currency: 'INR' }
  | { provider: 'unconfigured' }
  | { provider: 'error'; message: string };

export type PayOutcome =
  | { kind: 'paid' }
  | { kind: 'failed'; message: string }
  | { kind: 'dismissed' };

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', cb: (resp: { error?: { description?: string } }) => void) => void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loader: Promise<RazorpayCtor> | null = null;

export function loadRazorpay(): Promise<RazorpayCtor> {
  const w = window as unknown as { Razorpay?: RazorpayCtor };
  if (w.Razorpay) return Promise.resolve(w.Razorpay);
  if (loader) return loader;
  loader = new Promise<RazorpayCtor>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (w.Razorpay ? resolve(w.Razorpay) : reject(new Error('Razorpay unavailable')));
    s.onerror = () => {
      loader = null;
      reject(new Error('Could not load the payment window'));
    };
    document.body.appendChild(s);
  });
  return loader;
}

async function postVerify(body: Record<string, unknown>) {
  const res = await fetch('/api/registrations/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
}

export interface PayOptions {
  bookingId: string;
  accessToken: string;
  payment: Extract<PaymentInit, { provider: 'razorpay' }>;
  siteName: string;
  description: string;
  prefill: { name?: string; email?: string; contact?: string };
}

/** Opens Razorpay Checkout and verifies the result on the server. */
export async function payWithRazorpay(opts: PayOptions): Promise<PayOutcome> {
  let Razorpay: RazorpayCtor;
  try {
    Razorpay = await loadRazorpay();
  } catch {
    return { kind: 'failed', message: 'The payment window could not be loaded. Check your connection and retry.' };
  }

  return new Promise<PayOutcome>((resolve) => {
    let settled = false;
    let lastFailure = '';
    const done = (o: PayOutcome) => {
      if (settled) return;
      settled = true;
      resolve(o);
    };

    const rzp = new Razorpay({
      key: opts.payment.keyId,
      order_id: opts.payment.orderId,
      amount: opts.payment.amount,
      currency: opts.payment.currency,
      name: opts.siteName,
      description: opts.description,
      prefill: opts.prefill,
      notes: { bookingId: opts.bookingId },
      // UPI first (QR on desktop, UPI apps on mobile — Razorpay picks the flow per device),
      // then Checkout's default methods: cards (incl. RuPay), net banking, wallets.
      config: {
        display: {
          blocks: {
            upi: { name: 'Pay using UPI', instruments: [{ method: 'upi' }] },
          },
          sequence: ['block.upi'],
          preferences: { show_default_blocks: true },
        },
      },
      handler: async (resp: RazorpayResponse) => {
        const r = await postVerify({ bookingId: opts.bookingId, accessToken: opts.accessToken, ...resp });
        done(r.ok ? { kind: 'paid' } : { kind: 'failed', message: r.error || 'Payment could not be verified.' });
      },
      modal: {
        confirm_close: true,
        // Closed after a failed attempt → report the failure, otherwise the user simply dismissed it.
        ondismiss: () => done(lastFailure ? { kind: 'failed', message: lastFailure } : { kind: 'dismissed' }),
      },
    });

    // Razorpay lets the user retry inside the modal, so record the failure and wait for the modal to close.
    rzp.on('payment.failed', (resp) => {
      lastFailure = resp?.error?.description || 'The payment did not go through.';
      void postVerify({ bookingId: opts.bookingId, accessToken: opts.accessToken, failed: true });
    });

    rzp.open();
  });
}
