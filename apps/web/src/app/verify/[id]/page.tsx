import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, CalendarDays, Clock, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AccentText, Container, Kicker } from '@ascend/ui';
import { getSettings } from '../../../lib/community-store';
import { formatEventDate, locationLabel } from '../../../lib/events';
import { findCertificate, isCertificateValid } from '../../../lib/certificates';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify certificate',
  robots: { index: false, follow: false, nocache: true },
};

/** Public verification page opened from the certificate's QR code. */
export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificateId = decodeURIComponent(id).toUpperCase();
  const record = findCertificate(certificateId);
  const valid = !!record && isCertificateValid(record.reg);
  const { siteName } = getSettings();
  const event = record?.event;
  const issued = record?.reg.attendedAt
    ? new Date(record.reg.attendedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : undefined;

  return (
    <section className="grain relative overflow-hidden">
      <div className="aurora opacity-70" aria-hidden>
        <i />
      </div>
      <Container size="wide" className="relative z-10 flex min-h-[70svh] flex-col items-center justify-center py-14 md:py-20">
        <div className="w-full max-w-[640px]">
          <Kicker tone={valid ? 'gold' : 'blue'}>Certificate verification</Kicker>
          <h1 className="mt-5 font-display text-[clamp(38px,6vw,72px)] font-medium leading-[0.95] tracking-[-0.05em] text-[var(--fg)]">
            {valid ? (
              <>
                Verified <AccentText tone="gold">certificate.</AccentText>
              </>
            ) : (
              <>
                Not a valid <AccentText tone="hero">certificate.</AccentText>
              </>
            )}
          </h1>

          <div
            className={`mt-8 overflow-hidden rounded-[28px] border p-6 md:p-8 ${valid ? 'border-ok/30 bg-ok/[0.06]' : 'border-bad/30 bg-bad/[0.06]'}`}
            role="status"
          >
            <div className="flex items-start gap-4">
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${valid ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}`}>
                {valid ? <ShieldCheck className="h-7 w-7" aria-hidden /> : <ShieldAlert className="h-7 w-7" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Certificate ID</p>
                <p className="break-all font-mono text-[18px] font-semibold text-[var(--fg)]">{certificateId}</p>
                {!valid && (
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--fg-soft)]">
                    No valid certificate with this ID was issued by {siteName}. Check the ID on the document, or contact us if you
                    believe this is a mistake.
                  </p>
                )}
              </div>
            </div>

            {valid && record && (
              <dl className="mt-6 grid gap-4 border-t border-[var(--line)] pt-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Awarded to</dt>
                  <dd className="mt-1 font-display text-[28px] font-medium leading-tight text-[var(--fg)]">{record.reg.name}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">For attending</dt>
                  <dd className="mt-1 text-[17px] font-medium text-[var(--fg)]">
                    {event ? (
                      <Link href={`/events/${event.slug}`} className="hover:text-gold-soft">
                        {record.reg.eventTitle}
                      </Link>
                    ) : (
                      record.reg.eventTitle
                    )}
                  </dd>
                </div>
                {event && (
                  <>
                    <div className="flex items-center gap-2 text-[14px] text-[var(--fg-soft)]">
                      <CalendarDays className="h-4 w-4 text-brand-200" aria-hidden /> {formatEventDate(event, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2 text-[14px] text-[var(--fg-soft)]">
                      <MapPin className="h-4 w-4 text-brand-200" aria-hidden /> {locationLabel(event)}
                    </div>
                  </>
                )}
                {event?.cpeHours && event.cpeHours > 0 ? (
                  <div className="flex items-center gap-2 text-[14px] text-[var(--fg-soft)]">
                    <Clock className="h-4 w-4 text-gold" aria-hidden /> CPE / learning hours: <strong className="text-[var(--fg)]">{event.cpeHours}</strong>
                  </div>
                ) : null}
                {issued && (
                  <div className="flex items-center gap-2 text-[14px] text-[var(--fg-soft)]">
                    <BadgeCheck className="h-4 w-4 text-ok" aria-hidden /> Issued {issued}
                  </div>
                )}
              </dl>
            )}
          </div>
          <p className="mt-5 text-center text-[13px] text-[var(--muted)]">Issued by {siteName}. This page reflects the current record.</p>
        </div>
      </Container>
    </section>
  );
}
