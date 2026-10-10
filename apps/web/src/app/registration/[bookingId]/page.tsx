import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Award, CalendarDays, CheckCircle2, Clock, CreditCard, Download, Hourglass, MapPin, Navigation, ShieldCheck, XCircle } from 'lucide-react';
import { AccentText, Container, Kicker, cn } from '@ascend/ui';
import { getSettings } from '../../../lib/community-store';
import { dateParts, formatEventDate, locationLabel, priceLabel } from '../../../lib/events';
import { siteUrl } from '../../../lib/seo';
import { certificatePdfPath, isCertificateValid } from '../../../lib/certificates';
import { checkinPayload, checkinQrSvg, ensureCheckinCode } from '../../../lib/checkin';
import { findEventById, findRegistrationWithToken, razorpayConfig } from '../../api/registrations/_lib/server';
import { mapsLink } from '../../../components/events/event-time';
import { mailConfigured } from '../../../lib/mailer';
import { receiptKind, receiptPdfPath } from '../../../lib/receipts';
import {
  AddToCalendarButton,
  CopyBookingId,
  PrintButton,
  RememberBooking,
} from '../../../components/events/RegistrationActions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your registration',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

type View = 'confirmed' | 'pending' | 'failed' | 'cancelled';

const BADGE: Record<View, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  confirmed: { label: 'Confirmed', className: 'border-ok/30 bg-ok/15 text-ok', Icon: CheckCircle2 },
  pending: { label: 'Pending payment', className: 'border-warn/30 bg-warn/15 text-warn', Icon: Hourglass },
  failed: { label: 'Payment failed', className: 'border-bad/30 bg-bad/15 text-bad', Icon: XCircle },
  cancelled: { label: 'Cancelled', className: 'border-mist/20 bg-mist/10 text-[var(--muted)]', Icon: XCircle },
};

const PAYMENT_LABEL: Record<string, string> = {
  not_required: 'Not required (free event)',
  pending: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Failed — not charged',
  refunded: 'Refunded',
};

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #event-pass, #event-pass * { visibility: visible !important; }
  #event-pass { position: absolute; inset: 0 auto auto 0; width: 100%; margin: 0; box-shadow: none !important; }
  @page { margin: 14mm; }
}`;

function Row({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-6">
      <dt className="text-[13px] text-[var(--muted)] print:text-black/60">{label}</dt>
      <dd className={cn('text-[14.5px] text-[var(--fg)] sm:text-right print:text-black', mono && 'break-all font-mono')}>{value}</dd>
    </div>
  );
}

export default async function RegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ t?: string | string[] }>;
}) {
  const { bookingId } = await params;
  const sp = await searchParams;
  const token = Array.isArray(sp.t) ? sp.t[0] : sp.t;
  if (!token) notFound();

  const reg = findRegistrationWithToken(safeDecode(bookingId), token);
  if (!reg) notFound();

  const settings = getSettings();
  const event = findEventById(reg.eventId);
  const view: View =
    reg.status === 'confirmed'
      ? 'confirmed'
      : reg.status === 'cancelled'
        ? 'cancelled'
        : reg.paymentStatus === 'failed'
          ? 'failed'
          : 'pending';
  const badge = BADGE[view];
  // Entry QR only for confirmed bookings (pending / cancelled bookings are not valid for entry).
  const qrSvg = view === 'confirmed' ? await checkinQrSvg(checkinPayload(reg, ensureCheckinCode(reg))) : null;
  const gatewayOn = !!razorpayConfig();
  const emailOn = mailConfigured();
  const feeLabel = priceLabel(reg.fee);
  const d = event ? dateParts(event) : null;
  const maps = event ? mapsLink(event) : null;
  const eventUrl = `${siteUrl()}/events/${reg.eventSlug}`;
  const issued = new Date(reg.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  const paidAt = reg.paidAt
    ? new Date(reg.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
    : undefined;

  const headline =
    view === 'confirmed'
      ? { a: "You're", b: 'in.' }
      : view === 'failed'
        ? { a: 'Payment', b: "didn't go through." }
        : view === 'cancelled'
          ? { a: 'Registration', b: 'cancelled.' }
          : { a: 'Almost', b: 'there.' };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <RememberBooking eventSlug={reg.eventSlug} bookingId={reg.bookingId} accessToken={token} />

      <section className="grain relative overflow-hidden print:hidden">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        {view === 'confirmed' && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className={cn('float absolute rounded-full', i % 3 === 0 ? 'bg-gold' : i % 3 === 1 ? 'bg-brand-300' : 'bg-mist/60')}
                style={{
                  left: `${(i * 37) % 100}%`,
                  top: `${(i * 53) % 90}%`,
                  width: 4 + (i % 4) * 3,
                  height: 4 + (i % 4) * 3,
                  animationDelay: `${(i % 6) * 0.6}s`,
                  opacity: 0.55,
                }}
              />
            ))}
          </div>
        )}
        <Container size="wide" className="relative z-10 pb-12 pt-12 md:pb-16 md:pt-16">
          <div aria-live="polite">
            <span className={cn('inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.08em]', badge.className)}>
              <badge.Icon className="h-4 w-4" aria-hidden /> {badge.label}
            </span>
            <h1 className="mt-6 font-display text-[clamp(56px,11vw,160px)] font-medium leading-[0.86] tracking-[-0.065em] text-[var(--fg)]">
              {headline.a} <AccentText tone={view === 'confirmed' ? 'gold' : 'hero'}>{headline.b}</AccentText>
            </h1>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--muted)]">Booking ID</span>
            <span className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-2 font-mono text-[clamp(18px,2.6vw,28px)] font-medium tracking-[0.04em] text-gold-soft">
              {reg.bookingId}
            </span>
            <CopyBookingId bookingId={reg.bookingId} />
          </div>

          <div className="mt-8 max-w-[62ch] text-[16px] leading-relaxed text-[var(--fg-soft)]">
            {view === 'confirmed' && (
              <p>
                Your seat for <strong className="text-[var(--fg)]">{reg.eventTitle}</strong> is confirmed.{' '}
                {emailOn
                  ? `A confirmation email will be sent to ${reg.email}.`
                  : 'Save this page or note your booking ID — email confirmations will be enabled soon.'}
              </p>
            )}
            {view === 'pending' &&
              (gatewayOn ? (
                <p>
                  Your registration for <strong className="text-[var(--fg)]">{reg.eventTitle}</strong> is saved, but your seat is
                  confirmed only once the payment of {feeLabel} goes through.
                </p>
              ) : (
                <p>
                  Your registration for <strong className="text-[var(--fg)]">{reg.eventTitle}</strong> is saved as{' '}
                  <strong className="text-warn">pending payment</strong>. Online payment isn&apos;t enabled on the website yet, so
                  nothing has been charged — our team will share payment details for {feeLabel}
                  {settings.contact.email ? (
                    <>
                      {' '}
                      (questions:{' '}
                      <a className="text-brand-200 underline underline-offset-4" href={`mailto:${settings.contact.email}`}>
                        {settings.contact.email}
                      </a>
                      )
                    </>
                  ) : null}
                  . Save this page or note your booking ID.
                </p>
              ))}
            {view === 'failed' && (
              <p>
                Your registration is saved but the last payment attempt failed, so your seat isn&apos;t confirmed yet. If any amount
                was debited, it is usually reversed automatically by your bank — retry below or contact us with your booking ID.
              </p>
            )}
            {view === 'cancelled' && <p>This registration has been cancelled. Contact us with your booking ID if this is unexpected.</p>}
          </div>

          {(view === 'pending' || view === 'failed') && gatewayOn && reg.fee > 0 && (
            <div className="mt-6">
              <Link
                href={`/registration/${encodeURIComponent(reg.bookingId)}/pay?t=${encodeURIComponent(token)}`}
                className="inline-flex h-12 w-fit items-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white shadow-[0_14px_36px_-12px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 print:hidden"
              >
                <CreditCard className="h-4 w-4" aria-hidden /> {view === 'failed' ? 'Retry payment' : 'Complete payment'} · {feeLabel}
              </Link>
            </div>
          )}

          {view === 'confirmed' && (
            <div className="mt-6 flex flex-col gap-4 rounded-[24px] border border-gold/30 bg-gold/[0.06] p-5 print:hidden sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-grad-gold text-brand-950">
                  <Award className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-[18px] font-medium text-[var(--fg)]">Certificate of participation</p>
                  <p className="text-[13.5px] text-[var(--muted)]">
                    {isCertificateValid(reg)
                      ? `Ready${event?.cpeHours ? ` · ${event.cpeHours} CPE / learning hours` : ''} · ID ${reg.certificateId}`
                      : 'Available here after you are checked in at the event.'}
                  </p>
                </div>
              </div>
              {isCertificateValid(reg) && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={certificatePdfPath(reg.certificateId!, token)}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950 hover:brightness-105"
                  >
                    <Download className="h-4 w-4" aria-hidden /> Download PDF
                  </a>
                  <Link
                    href={`/verify/${reg.certificateId}`}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-mist/[0.18] px-4 text-[14px] font-semibold text-[var(--fg)] hover:border-mist/50"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden /> Verify
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {event && view !== 'cancelled' && (
              <AddToCalendarButton
                fileName={reg.eventSlug}
                ics={{
                  uid: `${reg.bookingId}@${new URL(siteUrl()).host}`,
                  title: event.title,
                  date: event.date,
                  time: event.time,
                  endTime: event.endTime,
                  location: locationLabel(event),
                  description: `Booking ID: ${reg.bookingId}\n${eventUrl}`,
                  url: eventUrl,
                }}
              />
            )}
            {receiptKind(reg) && token && (
              <a
                href={receiptPdfPath(reg.bookingId, token)}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-mist/[0.16] px-5 text-[14.5px] font-semibold text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                <Download className="h-4 w-4" aria-hidden /> {reg.fee > 0 ? 'Download receipt (PDF)' : 'Download confirmation (PDF)'}
              </a>
            )}
            <PrintButton />
          </div>
        </Container>
      </section>

      {/* Printable pass / receipt */}
      <Container size="wide" className="pb-24">
        <article
          id="event-pass"
          aria-labelledby="pass-h"
          className="relative overflow-hidden rounded-[28px] border border-mist/[0.12] bg-grad-surface print:rounded-none print:border-black/30 print:bg-white print:text-black"
        >
          <div className="flex flex-col gap-6 border-b border-dashed border-mist/[0.16] p-6 md:flex-row md:items-start md:justify-between md:p-8 print:border-black/30">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold print:text-black/70">
                {settings.siteName} · {reg.fee > 0 ? 'Event pass & payment receipt' : 'Event pass'}
              </p>
              <h2 id="pass-h" className="mt-2 font-display text-[clamp(24px,3vw,38px)] font-medium leading-tight tracking-[-0.03em] text-[var(--fg)] print:text-black">
                {reg.eventTitle}
              </h2>
              {event && (
                <ul className="mt-4 flex flex-col gap-2 text-[14.5px] text-[var(--fg-soft)] sm:flex-row sm:flex-wrap sm:gap-x-6 print:text-black">
                  <li className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-200 print:text-black" aria-hidden />
                    {formatEventDate(event, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </li>
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-brand-200 print:text-black" aria-hidden />
                    {event.time}
                    {event.endTime ? ` – ${event.endTime}` : ''} IST
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-200 print:text-black" aria-hidden />
                    {locationLabel(event)}
                  </li>
                </ul>
              )}
            </div>
            {d && (
              <div className="shrink-0 rounded-2xl border border-mist/[0.14] px-5 py-3 text-center print:border-black/30">
                <span className="block font-display text-[40px] font-semibold leading-none text-[var(--fg)] print:text-black">{d.day}</span>
                <span className="mt-1 block font-mono text-[11px] tracking-[0.16em] text-gold print:text-black/70">
                  {d.month} {d.year}
                </span>
              </div>
            )}
          </div>

          {qrSvg && (
            <div className="flex flex-col items-center gap-5 border-b border-dashed border-mist/[0.16] p-6 sm:flex-row md:p-8 print:border-black/30">
              <div
                className="h-[176px] w-[176px] shrink-0 overflow-hidden rounded-2xl bg-white p-2.5 shadow-[0_18px_40px_-20px_rgb(var(--gold-rgb)/0.8)] ring-2 ring-gold/40 [&>svg]:h-full [&>svg]:w-full"
                role="img"
                aria-label={`Entry QR code for booking ${reg.bookingId}`}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="text-center sm:text-left">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold print:text-black/70">Entry pass</p>
                <p className="mt-1 font-display text-[22px] font-medium leading-tight text-[var(--fg)] print:text-black">Show this QR at the entrance</p>
                <p className="mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-[var(--muted)] print:text-black/70">
                  Our volunteers scan it to check you in. Keep this page open, take a screenshot or print it. Your booking ID{' '}
                  <span className="font-mono text-[var(--fg)] print:text-black">{reg.bookingId}</span> also works.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-0 md:grid-cols-2">
            <section aria-labelledby="attendee-h" className="p-6 md:border-r md:border-mist/[0.1] md:p-8 print:border-black/20">
              <h3 id="attendee-h" className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] print:text-black/60">
                Attendee
              </h3>
              <dl className="mt-2 divide-y divide-mist/[0.08] print:divide-black/10">
                <Row label="Name" value={reg.name} />
                <Row label="Email" value={reg.email} />
                <Row label="Mobile" value={reg.mobile} />
                <Row label="City" value={reg.city} />
                <Row label="Membership / reg. no." value={reg.membershipNo} />
                <Row label="Organisation" value={reg.organisation} />
                <Row label="Designation" value={reg.designation} />
                <Row label="Special requirements" value={reg.requirements} />
              </dl>
            </section>
            <section aria-labelledby="payment-h" className="border-t border-mist/[0.1] p-6 md:border-t-0 md:p-8 print:border-black/20">
              <h3 id="payment-h" className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] print:text-black/60">
                {reg.fee > 0 ? 'Payment receipt' : 'Booking'}
              </h3>
              <dl className="mt-2 divide-y divide-mist/[0.08] print:divide-black/10">
                <Row label="Booking ID" value={reg.bookingId} mono />
                <Row label="Status" value={badge.label} />
                <Row label="Registered on" value={issued} />
                <Row label="Amount" value={reg.fee > 0 ? `${feeLabel} (INR)` : 'Free'} />
                <Row label="Payment" value={PAYMENT_LABEL[reg.paymentStatus] || reg.paymentStatus} />
                <Row label="Payment reference" value={reg.gatewayPaymentId} mono />
                <Row label="Paid on" value={paidAt} />
              </dl>
              {view !== 'confirmed' && (
                <p className="mt-4 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-[13px] text-warn print:border-black/30 print:bg-white print:text-black">
                  Not valid for entry until the status shows Confirmed.
                </p>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-1 border-t border-dashed border-mist/[0.16] px-6 py-4 text-[12px] text-[var(--muted)] md:flex-row md:justify-between md:px-8 print:border-black/30 print:text-black/60">
            <span>Keep this pass handy — printed or on your phone — for check-in.</span>
            <span className="font-mono">{eventUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        </article>

        {/* Next steps */}
        <section aria-labelledby="next-h" className="mt-14 print:hidden">
          <Kicker>What happens next</Kicker>
          <h2 id="next-h" className="mt-4 font-display text-[clamp(28px,3.4vw,44px)] font-medium tracking-[-0.04em] text-[var(--fg)]">
            Your <AccentText tone="blue">next steps</AccentText>
          </h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              view === 'confirmed'
                ? { t: 'Save your pass', d: 'Print it, save it as PDF or bookmark this page — the link is private to you.' }
                : { t: 'Complete payment', d: gatewayOn ? 'Use the Pay button above. Your seat is held only once payment succeeds.' : 'Our team will share payment details. Keep your booking ID ready.' },
              { t: 'Block your calendar', d: 'Add the event to your calendar so you don’t miss it.' },
              event?.mode === 'Online'
                ? { t: 'Join online', d: 'The joining link is shared with confirmed registrants before the event.' }
                : { t: 'Plan your trip', d: 'Arrive a little early for check-in and keep this pass handy.' },
            ].map((s, i) => (
              <li key={s.t} className="rounded-[24px] border border-mist/[0.1] bg-grad-surface p-6">
                <span className="font-mono text-[12px] text-gold">0{i + 1}</span>
                <p className="mt-3 font-display text-[20px] font-medium tracking-[-0.02em] text-[var(--fg)]">{s.t}</p>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            {maps && (
              <a
                href={maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-mist/[0.16] px-5 text-[14.5px] font-semibold text-[var(--fg)] hover:border-mist/40"
              >
                <Navigation className="h-4 w-4" aria-hidden /> Directions
              </a>
            )}
            <Link
              href={`/events/${reg.eventSlug}`}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-mist/[0.16] px-5 text-[14.5px] font-semibold text-[var(--fg)] hover:border-mist/40"
            >
              Event page
            </Link>
            <Link
              href="/events"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-grad-primary pl-5 pr-1.5 text-[14.5px] font-semibold text-white hover:brightness-110"
            >
              Explore more events
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
