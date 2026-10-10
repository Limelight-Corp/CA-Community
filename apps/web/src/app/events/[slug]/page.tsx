import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  ScrollText,
  Ticket,
  Users,
  Wifi,
} from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { AccentText, Avatar, Container, Kicker, cn } from '@ascend/ui';
import { Reveal } from '../../../components/ui-client';
import { getItems, getSettings } from '../../../lib/community-store';
import {
  canRegister,
  dateParts,
  eventSpeakers,
  eventStatus,
  eventWing,
  formatEventDate,
  locationLabel,
  priceLabel,
  seatsLeft,
  STATUS_LABEL,
  type EventStatus,
} from '../../../lib/events';
import { jsonLd, siteUrl } from '../../../lib/seo';
import { eventInstants, mapsLink, toIstIso } from '../../../components/events/event-time';
import { ShareButtons } from '../../../components/events/ShareButtons';
import { StickyRegisterBar } from '../../../components/events/StickyRegisterBar';

type Params = Promise<{ slug: string }>;

function findEvent(slug: string): CommunityEvent | undefined {
  return getItems<CommunityEvent>('events', true).find((e) => e.slug === slug);
}

const STATUS_STYLE: Record<EventStatus, string> = {
  open: 'bg-ok/15 text-ok border-ok/30',
  filling: 'bg-warn/15 text-warn border-warn/30',
  soldout: 'bg-bad/15 text-bad border-bad/30',
  closed: 'bg-mist/10 text-[var(--muted)] border-mist/20',
  past: 'bg-mist/10 text-[var(--muted)] border-mist/20',
  cancelled: 'bg-bad/15 text-bad border-bad/30',
};

function summary(e: CommunityEvent): string {
  const text = (e.description || '').replace(/\s+/g, ' ').trim();
  const lead = `${formatEventDate(e, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${e.time} · ${locationLabel(e)}.`;
  return text ? `${lead} ${text}`.slice(0, 220) : `${e.category} — ${lead}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const event = findEvent(slug);
  if (!event) return { title: 'Event not found', robots: { index: false } };
  const description = summary(event);
  const images = event.imageUrl ? [{ url: event.imageUrl, alt: event.title }] : undefined;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: { type: 'website', title: event.title, description, url: `/events/${event.slug}`, images },
    twitter: { card: 'summary_large_image', title: event.title, description, images: event.imageUrl ? [event.imageUrl] : undefined },
  };
}

export default async function EventDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const event = findEvent(slug);
  if (!event) notFound();

  const settings = getSettings();
  const wings = getItems<CommunityWing>('wings', true);
  const speakers = eventSpeakers(event, getItems<CommunitySpeaker>('speakers', true));
  const wing = eventWing(event, wings);
  const status = eventStatus(event);
  const registerable = canRegister(event);
  const left = seatsLeft(event);
  const takenPct = event.seatsTotal > 0 ? Math.min(100, Math.round(((event.seatsTotal - left) / event.seatsTotal) * 100)) : 0;
  const d = dateParts(event);
  const { start, end } = eventInstants(event);
  const maps = mapsLink(event);
  const url = `${siteUrl()}/events/${event.slug}`;
  const accent = wing?.color || 'var(--brand-500)';
  const hasMemberPrice = event.memberFee > 0 && event.memberFee < event.fee;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: (event.description || summary(event)).slice(0, 5000),
    startDate: toIstIso(start),
    endDate: toIstIso(end),
    eventStatus: event.cancelledAt ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      event.mode === 'Online' ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
    location:
      event.mode === 'Online'
        ? { '@type': 'VirtualLocation', url }
        : {
            '@type': 'Place',
            name: event.venue || event.city,
            address: { '@type': 'PostalAddress', streetAddress: event.venue, addressLocality: event.city, addressCountry: 'IN' },
            ...(maps ? { hasMap: maps } : {}),
          },
    image: event.imageUrl ? [event.imageUrl.startsWith('http') ? event.imageUrl : `${siteUrl()}${event.imageUrl}`] : undefined,
    url,
    organizer: { '@type': 'Organization', name: settings.siteName, url: siteUrl() },
    performer: speakers.length ? speakers.map((s) => ({ '@type': 'Person', name: s.name })) : undefined,
    offers: {
      '@type': 'Offer',
      url: `${url}/register`,
      price: event.fee,
      priceCurrency: 'INR',
      availability: registerable ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
  };

  const registerCta = registerable ? (
    <Link
      href={`/events/${event.slug}/register`}
      className="group inline-flex h-14 w-full items-center justify-between gap-2 rounded-full bg-grad-primary pl-6 pr-2 text-[15.5px] font-semibold text-white shadow-[0_14px_36px_-12px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <span className="inline-flex items-center gap-2">
        <Ticket className="h-5 w-5" aria-hidden /> Register now
      </span>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-45">
        <ArrowUpRight className="h-5 w-5" aria-hidden />
      </span>
    </Link>
  ) : (
    <span className="inline-flex h-14 w-full items-center justify-center rounded-full border border-mist/[0.14] text-[15px] font-semibold text-[var(--muted)]" aria-disabled>
      {STATUS_LABEL[status]}
    </span>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

      {/* Hero */}
      <section className="grain relative overflow-hidden">
        <div className="aurora" aria-hidden>
          <i />
        </div>
        <Container size="wide" className="relative z-10 pb-10 pt-8 md:pt-12">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full px-1 py-1 font-mono text-[12px] uppercase tracking-[0.1em] text-[var(--muted)] transition hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> All events
          </Link>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Kicker tone="gold">{event.category}</Kicker>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mist/[0.14] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
              {event.mode === 'Online' ? <Wifi className="h-3.5 w-3.5" aria-hidden /> : <MapPin className="h-3.5 w-3.5" aria-hidden />}
              {event.mode === 'Online' ? 'Online' : 'In person'}
            </span>
            {wing && (
              <span className="inline-flex items-center gap-2 rounded-full border border-mist/[0.14] px-3 py-1.5 text-[12px] text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full" style={{ background: wing.color }} aria-hidden />
                Wing {String(wing.number).padStart(2, '0')} · {wing.name}
              </span>
            )}
            <span className={cn('rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em]', STATUS_STYLE[status])}>
              {status === 'open' || status === 'filling' ? <span className="live-dot mr-2 inline-block align-middle" aria-hidden /> : null}
              {STATUS_LABEL[status]}
            </span>
          </div>

          <h1 className="mt-6 max-w-[18ch] text-balance font-display text-[clamp(40px,7.2vw,104px)] font-medium leading-[0.92] tracking-[-0.055em] text-[var(--fg)]">
            {event.title}
          </h1>

          {event.cancelledAt && (
            <div role="status" className="mt-6 max-w-[62ch] rounded-2xl border border-bad/30 bg-bad/10 p-4 text-[15px] leading-relaxed text-[var(--fg)]">
              <strong className="text-bad">This event has been cancelled.</strong> Registered attendees have been informed by email.
              {event.cancellationNote ? ` ${event.cancellationNote}` : ''}
            </div>
          )}

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[15px] text-[var(--fg-soft)]">
            <li className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-gold" aria-hidden />
              <time dateTime={event.date}>{formatEventDate(event, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</time>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gold" aria-hidden />
              {event.time}
              {event.endTime ? ` – ${event.endTime}` : ''} IST
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gold" aria-hidden />
              {locationLabel(event)}
            </li>
          </ul>
        </Container>
      </section>

      {/* Banner */}
      <Container size="wide">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] border border-mist/[0.1] sm:aspect-[21/9]">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt={`${event.title} banner`} className="h-full w-full object-cover" />
          ) : (
            <div
              className="relative h-full w-full"
              style={{
                background: `radial-gradient(70% 90% at 88% 8%, color-mix(in srgb, ${accent} 70%, transparent) 0%, transparent 60%), radial-gradient(60% 80% at 0% 100%, rgb(var(--gold-rgb) / 0.3), transparent 60%), linear-gradient(155deg, var(--brand-800), var(--brand-950))`,
              }}
              aria-hidden
            >
              <div className="grid-lines absolute inset-0" />
              <span className="absolute -bottom-[0.18em] right-4 font-display text-[clamp(120px,26vw,360px)] font-semibold leading-none tracking-[-0.08em] text-outline">
                {d.day}
              </span>
              <span className="absolute left-5 top-5 font-mono text-[12px] uppercase tracking-[0.18em] text-gold-soft md:left-8 md:top-8">
                {d.weekday} · {d.month} {d.year}
              </span>
              <span className="absolute bottom-5 left-5 max-w-[14ch] font-display text-[clamp(26px,4vw,56px)] font-medium leading-[0.95] tracking-[-0.04em] text-white/90 md:bottom-8 md:left-8">
                {event.category}
                <br />
                <AccentText tone="gold">{event.mode === 'Online' ? 'online' : event.city}</AccentText>
              </span>
            </div>
          )}
        </div>
      </Container>

      {/* Body */}
      <Container size="wide" className="grid gap-12 pb-32 pt-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:pb-24">
        <div className="flex min-w-0 flex-col gap-14">
          {/* About */}
          <Reveal as="section" aria-labelledby="about-h">
            <h2 id="about-h" className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold">
              About the event
            </h2>
            {event.description ? (
              <div className="mt-5 flex flex-col gap-4 text-[clamp(16px,1.35vw,18.5px)] leading-[1.7] text-[var(--fg-soft)]">
                {event.description
                  .split(/\n{2,}/)
                  .filter((p) => p.trim())
                  .map((p, i) => (
                    <p key={i} className="whitespace-pre-line text-pretty">
                      {p.trim()}
                    </p>
                  ))}
              </div>
            ) : (
              <p className="mt-5 text-[16px] text-[var(--muted)]">Full details for this event will be published soon.</p>
            )}
          </Reveal>

          {/* Agenda */}
          {event.agenda && event.agenda.length > 0 && (
            <Reveal as="section" aria-labelledby="agenda-h">
              <h2 id="agenda-h" className="font-display text-[clamp(30px,3.6vw,48px)] font-medium tracking-[-0.04em] text-[var(--fg)]">
                The <AccentText tone="blue">agenda</AccentText>
              </h2>
              <ol className="relative mt-8 flex flex-col border-l border-mist/[0.12] pl-6 md:pl-8">
                {event.agenda.map((item, i) => (
                  <li key={`${item.time}-${i}`} className="group relative pb-8 last:pb-0">
                    <span
                      className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-bg bg-brand-500 shadow-[0_0_0_4px_rgb(var(--lime-rgb)/0.18)] transition group-hover:bg-gold md:-left-[39px]"
                      aria-hidden
                    />
                    <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-gold">{item.time}</span>
                    <p className="mt-1 font-display text-[clamp(18px,1.7vw,22px)] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)]">
                      {item.title}
                    </p>
                    {item.speaker && <p className="mt-1 text-[14px] text-[var(--muted)]">{item.speaker}</p>}
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          {/* Speakers */}
          {speakers.length > 0 && (
            <Reveal as="section" aria-labelledby="speakers-h">
              <h2 id="speakers-h" className="font-display text-[clamp(30px,3.6vw,48px)] font-medium tracking-[-0.04em] text-[var(--fg)]">
                On <AccentText tone="gold">stage</AccentText>
              </h2>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {speakers.map((s) => (
                  <li key={s.id || s.slug}>
                    <Link
                      href={`/speakers/${s.slug}`}
                      className="shine group flex h-full flex-col gap-4 rounded-[28px] border border-mist/[0.1] bg-grad-surface p-5 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar name={s.name} src={s.avatarUrl} size={64} rounded="xl" />
                        <div className="min-w-0">
                          <p className="truncate font-display text-[19px] font-medium tracking-[-0.02em] text-[var(--fg)]">{s.name}</p>
                          <p className="text-[13.5px] leading-snug text-[var(--muted)]">
                            {[s.title, s.organisation].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-[var(--muted)] transition-transform duration-300 group-hover:rotate-45 group-hover:text-[var(--fg)]" aria-hidden />
                      </div>
                      {s.expertise?.length > 0 && (
                        <ul className="flex flex-wrap gap-1.5" aria-label="Expertise">
                          {s.expertise.slice(0, 4).map((x) => (
                            <li key={x} className="rounded-full border border-mist/[0.12] px-2.5 py-1 text-[11.5px] text-[var(--muted)]">
                              {x}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {/* Venue */}
          <Reveal as="section" aria-labelledby="venue-h" className="rounded-[28px] border border-mist/[0.1] bg-grad-surface p-6 md:p-8">
            <h2 id="venue-h" className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold">
              {event.mode === 'Online' ? 'Where to join' : 'Venue'}
            </h2>
            <p className="mt-3 font-display text-[clamp(22px,2.4vw,30px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
              {event.mode === 'Online' ? 'Online event' : event.venue || event.city}
            </p>
            <p className="mt-1 text-[15px] text-[var(--muted)]">
              {event.mode === 'Online'
                ? 'The joining link is shared with confirmed registrants before the event.'
                : event.city}
            </p>
            {maps && (
              <a
                href={maps}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-mist/[0.16] px-5 text-[14px] font-medium text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              >
                <Navigation className="h-4 w-4" aria-hidden /> Open in Google Maps
                <ExternalLink className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </Reveal>

          {/* Terms */}
          <Reveal as="section" aria-labelledby="terms-h">
            <h2 id="terms-h" className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-gold">
              <ScrollText className="h-4 w-4" aria-hidden /> Terms &amp; conditions
            </h2>
            {event.terms ? (
              <p className="mt-4 whitespace-pre-line text-[14.5px] leading-relaxed text-[var(--muted)]">{event.terms}</p>
            ) : null}
            <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--muted)]">
              Registration is subject to our{' '}
              <Link href="/legal/event-terms" className="text-brand-200 underline decoration-brand-200/40 underline-offset-4 hover:text-[var(--fg)]">
                event registration terms
              </Link>
              , including cancellation and refund rules.
            </p>
          </Reveal>

          {/* Share */}
          <section aria-labelledby="share-h" className="flex flex-col gap-4 border-t border-mist/[0.08] pt-8">
            <h2 id="share-h" className="font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--fg)]">
              Bring your people along
            </h2>
            <ShareButtons url={url} title={event.title} />
          </section>
        </div>

        {/* Ticket card */}
        <aside aria-label="Registration" className="lg:relative">
          <div className="lg:sticky lg:top-[96px]">
            <div className="glass-panel relative overflow-hidden rounded-[28px] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">Registration fee</span>
                  <p className="mt-1 font-display text-[48px] font-semibold leading-none tracking-[-0.04em] text-[var(--fg)]">
                    {priceLabel(event.fee)}
                  </p>
                  {event.fee > 0 && hasMemberPrice && (
                    <p className="mt-2 text-[13.5px] text-gold">{priceLabel(event.memberFee)} for members</p>
                  )}
                </div>
                <span className="rounded-2xl border border-mist/[0.12] px-3 py-2 text-center">
                  <span className="block font-display text-[26px] font-semibold leading-none text-[var(--fg)]">{d.day}</span>
                  <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-gold">{d.month}</span>
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                    <Users className="h-4 w-4" aria-hidden /> Seats
                  </span>
                  <span className="font-medium text-[var(--fg)]">
                    {status === 'past' ? `${event.seatsTotal} total` : `${left} of ${event.seatsTotal} available`}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-mist/[0.08]"
                  role="progressbar"
                  aria-label="Seats taken"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={takenPct}
                >
                  <div
                    className={cn('h-full rounded-full', status === 'filling' || status === 'soldout' ? 'bg-grad-gold' : 'bg-grad-primary')}
                    style={{ width: `${takenPct}%` }}
                  />
                </div>
              </div>

              <p className={cn('mt-5 inline-flex rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em]', STATUS_STYLE[status])}>
                {STATUS_LABEL[status]}
              </p>

              <div className="mt-6 hidden lg:block">{registerCta}</div>
              {registerable && (
                <p className="mt-3 hidden text-center text-[12.5px] text-[var(--muted)] lg:block">Takes about two minutes.</p>
              )}
              {event.fee > 0 && hasMemberPrice && (
                <p className="mt-4 text-[12.5px] leading-relaxed text-[var(--muted)]">
                  Online checkout currently charges the standard fee. Members, please add your membership number when you register.
                </p>
              )}
            </div>
          </div>
        </aside>
      </Container>

      {/* Sticky mobile CTA */}
      <StickyRegisterBar>
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <div className="shrink-0">
            <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]">Fee</span>
            <span className="font-display text-[22px] font-semibold leading-none text-[var(--fg)]">{priceLabel(event.fee)}</span>
          </div>
          <div className="min-w-0 flex-1">{registerCta}</div>
        </div>
      </StickyRegisterBar>
    </>
  );
}
