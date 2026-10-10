import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, Mail, MapPin, Phone, User } from 'lucide-react';
import { AccentText, Container, Kicker, Stepper } from '@ascend/ui';
import { getSettings } from '../../../../lib/community-store';
import { formatEventDate, locationLabel, priceLabel } from '../../../../lib/events';
import { currentMember, loginUrl } from '../../../../lib/member-session';
import { findEventById, findRegistrationWithToken, razorpayConfig } from '../../../api/registrations/_lib/server';
import { PaymentMethods } from '../../../../components/events/PaymentMethods';
import { PayPanel } from '../../../../components/events/PayPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Payment',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

const STEPS = [{ label: 'Details' }, { label: 'Payment' }, { label: 'Confirmed' }];

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Step 2 of registration: a separate payment page. Members must be logged in to pay. */
export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const { bookingId: rawId } = await params;
  const sp = await searchParams;
  const token = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  if (!token) notFound();

  const bookingId = safeDecode(rawId);
  const reg = findRegistrationWithToken(bookingId, token);
  if (!reg) notFound();

  const self = `/registration/${encodeURIComponent(reg.bookingId)}/pay?t=${encodeURIComponent(token)}`;
  const receipt = `/registration/${encodeURIComponent(reg.bookingId)}?t=${encodeURIComponent(token)}`;

  // Nothing to pay (already paid, free or cancelled) → the booking page.
  if (reg.status !== 'pending_payment' || reg.paymentStatus === 'paid' || reg.fee <= 0) redirect(receipt);

  // Login is asked for here — only when the visitor is about to pay.
  if (!(await currentMember())) redirect(loginUrl(self));

  const settings = getSettings();
  const event = findEventById(reg.eventId);
  const gatewayOn = !!razorpayConfig();
  const feeLabel = priceLabel(reg.fee);
  const dateLabel = event
    ? formatEventDate(event, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const timeLabel = event ? `${event.time}${event.endTime ? ` – ${event.endTime}` : ''} IST` : null;

  return (
    <section className="grain relative overflow-hidden">
      <div className="aurora opacity-60" aria-hidden>
        <i />
      </div>
      <Container size="wide" className="relative z-10 pb-20 pt-8 md:pt-12">
        <Link
          href={`/events/${reg.eventSlug}`}
          className="inline-flex items-center gap-2 rounded-full py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Event details
        </Link>

        <div className="mt-6 flex flex-col gap-4">
          <Kicker>Payment</Kicker>
          <h1 className="max-w-[16ch] font-display text-[clamp(38px,6.4vw,88px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
            Complete your <AccentText tone="hero">payment.</AccentText>
          </h1>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
          {/* Order summary first on mobile */}
          <div className="lg:order-2">
            <div className="glass-panel rounded-[28px] p-5 md:p-6 lg:sticky lg:top-[96px]">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Order summary</p>
              <p className="mt-3 font-display text-[22px] font-medium leading-tight tracking-[-0.02em] text-[var(--fg)]">
                {reg.eventTitle}
              </p>
              {event && (
                <ul className="mt-4 grid gap-2.5 text-[14px] text-[var(--fg-soft)]">
                  <li className="flex items-center gap-2.5">
                    <CalendarDays className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {dateLabel}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {timeLabel}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {locationLabel(event)}
                  </li>
                </ul>
              )}
              <div className="mt-5 border-t border-mist/[0.1] pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Booking ID</p>
                <p className="mt-1 font-mono text-[15px] text-gold-soft">{reg.bookingId}</p>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-mist/[0.1] pt-4">
                <span className="text-[14px] text-[var(--muted)]">Total payable</span>
                <span className="font-display text-[32px] font-semibold leading-none tracking-[-0.03em] text-[var(--fg)]">
                  {feeLabel}
                </span>
              </div>
              <p className="mt-2 text-right text-[12px] text-[var(--muted)]">1 attendee · INR</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:order-1">
            <Stepper steps={STEPS} current={1} className="max-w-[560px]" />

            <div className="rounded-[22px] border border-mist/[0.12] bg-mist/[0.03] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Registered as</p>
                <Link
                  href={receipt}
                  className="text-[12.5px] text-brand-200 underline underline-offset-4 hover:text-[var(--fg)]"
                >
                  View booking
                </Link>
              </div>
              <ul className="mt-3 grid gap-2 text-[14px] text-[var(--fg-soft)] sm:grid-cols-3">
                <li className="flex min-w-0 items-center gap-2">
                  <User className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
                  <span className="truncate">{reg.name}</span>
                </li>
                <li className="flex min-w-0 items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
                  <span className="truncate">{reg.email}</span>
                </li>
                <li className="flex min-w-0 items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
                  <span className="truncate">+91 {reg.mobile}</span>
                </li>
              </ul>
            </div>

            <PaymentMethods />

            {gatewayOn ? (
              <PayPanel
                bookingId={reg.bookingId}
                accessToken={token}
                eventSlug={reg.eventSlug}
                eventTitle={reg.eventTitle}
                siteName={settings.siteName}
                fee={reg.fee}
                feeLabel={feeLabel}
                prefill={{ name: reg.name, email: reg.email, contact: reg.mobile }}
              />
            ) : (
              <div role="status" className="rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-[14px] leading-relaxed text-warn">
                Online payment isn&apos;t enabled on the website yet, so nothing can be charged right now. Your registration is saved
                as <strong>pending payment</strong> — our team will share payment details for {feeLabel}. Keep your booking ID{' '}
                <span className="font-mono">{reg.bookingId}</span> handy.
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
