import React from 'react';
import { Building2, CreditCard, QrCode, ShieldCheck, Smartphone } from 'lucide-react';

const UPI_APPS = ['BHIM', 'Google Pay', 'PhonePe', 'Paytm', 'Your bank’s UPI app'];

/** What the Razorpay checkout offers: UPI first (NPCI), then cards and net banking. */
export function PaymentMethods() {
  return (
    <div className="rounded-[22px] border border-mist/[0.12] bg-mist/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Pay securely with</p>
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ok">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Razorpay secure checkout
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-gold/25 bg-gold/[0.06] p-3.5">
        <p className="flex items-center gap-2 text-[14.5px] font-semibold text-[var(--fg)]">
          UPI <span className="rounded-full bg-gold/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-gold">Recommended</span>
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--muted)]">
          India’s Unified Payments Interface by NPCI — works with every UPI app.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <li className="flex items-center gap-2 text-[13px] text-[var(--fg-soft)]">
            <QrCode className="h-4 w-4 shrink-0 text-gold" aria-hidden /> Scan the QR code (computer)
          </li>
          <li className="flex items-center gap-2 text-[13px] text-[var(--fg-soft)]">
            <Smartphone className="h-4 w-4 shrink-0 text-gold" aria-hidden /> Pay in your UPI app (mobile)
          </li>
        </ul>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="UPI apps">
          {UPI_APPS.map((app) => (
            <li key={app} className="rounded-full border border-mist/[0.12] bg-bg/40 px-2.5 py-1 text-[11.5px] text-[var(--fg-soft)]">
              {app}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        <li className="flex items-center gap-2 rounded-xl border border-mist/[0.1] px-3 py-2.5 text-[13px] text-[var(--fg-soft)]">
          <CreditCard className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> RuPay, Visa &amp; Mastercard cards
        </li>
        <li className="flex items-center gap-2 rounded-xl border border-mist/[0.1] px-3 py-2.5 text-[13px] text-[var(--fg-soft)]">
          <Building2 className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> Net banking
        </li>
      </ul>
    </div>
  );
}
