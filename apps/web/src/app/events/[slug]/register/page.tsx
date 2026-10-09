import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import type { CommunityEvent } from '@ascend/shared';
import { AccentText, Container, Kicker } from '@ascend/ui';
import { getItems, getSettings } from '../../../../lib/community-store';
import {
  canRegister,
  eventStatus,
  formatEventDate,
  locationLabel,
  priceLabel,
  seatsLeft,
  STATUS_LABEL,
} from '../../../../lib/events';
import { RegistrationForm } from '../../../../components/events/RegistrationForm';
import { MEMBER_COOKIE, hasMemberSession, loginUrl } from '../../../../lib/member-session';

type Params = Promise<{ slug: string }>;

function findEvent(slug: string): CommunityEvent | undefined {
  return getItems<CommunityEvent>('events', true).find((e) => e.slug === slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = findEvent(slug);
  return {
    title: event ? `Register · ${event.title}` : 'Register',
    robots: { index: false, follow: true },
  };
}

const CLOSED_COPY = {
  soldout: { title: 'This one is', accent: 'sold out.', text: 'Every seat has been taken. Keep an eye on the calendar — new events drop regularly.' },
  closed: { title: 'Registrations are', accent: 'closed.', text: 'The organisers are no longer accepting registrations for this event.' },
  past: { title: 'This event has', accent: 'wrapped up.', text: 'It already took place. Find your next one on the events calendar.' },
} as const;

export default async function RegisterPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = findEvent(slug);
  if (!event) notFound();

  const settings = getSettings();
  const status = eventStatus(event);
  const open = canRegister(event);
  const dateLabel = formatEventDate(event, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = `${event.time}${event.endTime ? ` – ${event.endTime}` : ''} IST`;
  const location = locationLabel(event);
  const left = seatsLeft(event);

  // Paid events need a signed-in member: send visitors to log in and straight back here.
  if (open && event.fee > 0 && !hasMemberSession((await cookies()).get(MEMBER_COOKIE)?.value)) {
    redirect(loginUrl(`/events/${event.slug}/register`));
  }

  const summaryCard = (
    <div className="glass-panel rounded-[28px] p-5 md:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Order summary</p>
      <p className="mt-3 font-display text-[22px] font-medium leading-tight tracking-[-0.02em] text-[var(--fg)]">{event.title}</p>
      <ul className="mt-4 grid gap-2.5 text-[14px] text-[var(--fg-soft)]">
        <li className="flex items-center gap-2.5">
          <CalendarDays className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {dateLabel}
        </li>
        <li className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {timeLabel}
        </li>
        <li className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {location}
        </li>
        {open && (
          <li className="flex items-center gap-2.5">
            <Users className="h-4 w-4 shrink-0 text-brand-200" aria-hidden /> {left} seat{left === 1 ? '' : 's'} left
          </li>
        )}
      </ul>
      <div className="mt-5 flex items-end justify-between border-t border-mist/[0.1] pt-4">
        <span className="text-[14px] text-[var(--muted)]">Total payable</span>
        <span className="font-display text-[32px] font-semibold leading-none tracking-[-0.03em] text-[var(--fg)]">
          {priceLabel(event.fee)}
        </span>
      </div>
      {event.fee > 0 && <p className="mt-2 text-right text-[12px] text-[var(--muted)]">1 attendee · INR</p>}
    </div>
  );

  return (
    <section className="grain relative overflow-hidden">
      <div className="aurora opacity-60" aria-hidden>
        <i />
      </div>
      <Container size="wide" className="relative z-10 pb-20 pt-8 md:pt-12">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 rounded-full py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Event details
        </Link>

        {open ? (
          <>
            <div className="mt-6 flex flex-col gap-4">
              <Kicker>Registration</Kicker>
              <h1 className="max-w-[16ch] font-display text-[clamp(38px,6.4vw,88px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
                Grab your <AccentText tone="hero">seat.</AccentText>
              </h1>
            </div>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
              {/* Summary first on mobile */}
              <div className="lg:order-2">
                <div className="lg:sticky lg:top-[96px]">{summaryCard}</div>
              </div>
              <div className="min-w-0 lg:order-1">
                <RegistrationForm
                  siteName={settings.siteName}
                  event={{
                    slug: event.slug,
                    title: event.title,
                    dateLabel,
                    timeLabel,
                    location,
                    fee: event.fee,
                    feeLabel: priceLabel(event.fee),
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="mx-auto mt-10 flex max-w-[720px] flex-col items-start gap-6 rounded-[28px] border border-mist/[0.12] bg-grad-surface p-6 md:p-10" role="status">
            <Kicker tone="gold">{STATUS_LABEL[status]}</Kicker>
            <h1 className="font-display text-[clamp(34px,5vw,64px)] font-medium leading-[0.95] tracking-[-0.05em] text-[var(--fg)]">
              {CLOSED_COPY[status as keyof typeof CLOSED_COPY]?.title ?? 'Registrations are'}{' '}
              <AccentText tone="gold">{CLOSED_COPY[status as keyof typeof CLOSED_COPY]?.accent ?? 'closed.'}</AccentText>
            </h1>
            <p className="text-[16px] leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--fg)]">{event.title}</strong> — {dateLabel}.{' '}
              {CLOSED_COPY[status as keyof typeof CLOSED_COPY]?.text ?? CLOSED_COPY.closed.text}
            </p>
            <Link
              href="/events"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-grad-primary pl-5 pr-1.5 text-[15px] font-semibold text-white hover:brightness-110"
            >
              Browse upcoming events
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        )}
      </Container>
    </section>
  );
}
