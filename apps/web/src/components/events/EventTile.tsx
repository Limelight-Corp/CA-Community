import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Clock, MapPin, Mic2, Ticket, Users, Wifi } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { cn } from '@ascend/ui';
import {
  canRegister,
  dateParts,
  eventStatus,
  locationLabel,
  priceLabel,
  seatsLeft,
  STATUS_LABEL,
} from '../../lib/events';

const STATUS_STYLE = {
  open: 'bg-ok/15 text-ok border-ok/30',
  filling: 'bg-warn/15 text-warn border-warn/30',
  soldout: 'bg-bad/15 text-bad border-bad/30',
  closed: 'bg-mist/10 text-[var(--muted)] border-mist/20',
  past: 'bg-mist/10 text-[var(--muted)] border-mist/20',
} as const;

export interface EventTileProps {
  event: CommunityEvent;
  wing?: CommunityWing;
  speakers?: CommunitySpeaker[];
  className?: string;
  priority?: boolean;
}

/**
 * Event card (Website Checklist §4): name, banner, date, time, venue, online/offline, speaker,
 * fee, seats available, registration status and a Register Now button.
 */
export function EventTile({ event, wing, speakers = [], className }: EventTileProps) {
  const status = eventStatus(event);
  const d = dateParts(event);
  const left = seatsLeft(event);
  const accent = wing?.color || 'var(--brand-500)';
  const registerable = canRegister(event);

  return (
    <article
      className={cn(
        'shine group relative flex flex-col overflow-hidden rounded-[28px] border border-mist/[0.1] bg-grad-surface transition-transform duration-500 hover:-translate-y-1.5',
        className
      )}
    >
      {/* Banner */}
      <Link href={`/events/${event.slug}`} className="relative block aspect-[16/10] overflow-hidden" aria-label={event.title}>
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt={`${event.title} banner`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]"
            style={{
              background: `radial-gradient(90% 90% at 85% 10%, color-mix(in srgb, ${accent} 75%, transparent) 0%, transparent 60%), radial-gradient(70% 80% at 0% 100%, rgb(var(--gold-rgb) / 0.25), transparent 60%), linear-gradient(155deg, var(--brand-800), var(--brand-950))`,
            }}
          >
            <span className="absolute bottom-3 left-4 right-4 line-clamp-2 font-display text-[26px] font-medium leading-[1] tracking-[-0.03em] text-white/90">
              {event.title}
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="rounded-2xl bg-bg/80 px-3 py-2 text-center backdrop-blur-md">
            <span className="block font-display text-[24px] font-semibold leading-none text-white">{d.day}</span>
            <span className="mt-1 block font-mono text-[10px] tracking-[0.14em] text-gold">{d.month}</span>
          </span>
          <span className={cn('rounded-full border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] backdrop-blur-md', STATUS_STYLE[status])}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-mist/[0.12] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
            {event.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-mist/[0.12] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--muted)]">
            {event.mode === 'Online' ? <Wifi className="h-3 w-3" aria-hidden /> : <MapPin className="h-3 w-3" aria-hidden />}
            {event.mode}
          </span>
          {wing && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full" style={{ background: wing.color }} aria-hidden />
              Wing {String(wing.number).padStart(2, '0')}
            </span>
          )}
        </div>

        <h3 className="font-display text-[21px] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--fg)]">
          <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
            {event.title}
          </Link>
        </h3>

        <ul className="grid gap-2 text-[13.5px] text-[var(--muted)]">
          <li className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
            {d.weekday}, {d.day} {d.month} {d.year}
            <Clock className="ml-2 h-4 w-4 shrink-0 text-brand-200" aria-hidden />
            {event.time}
          </li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
            <span className="truncate">{locationLabel(event)}</span>
          </li>
          {speakers.length > 0 && (
            <li className="flex items-center gap-2">
              <Mic2 className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
              <span className="truncate">{speakers.map((s) => s.name).join(', ')}</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0 text-brand-200" aria-hidden />
            {status === 'past' ? `${event.seatsTotal} seats` : `${left} of ${event.seatsTotal} seats available`}
          </li>
        </ul>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-mist/[0.08] pt-4">
          <div>
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]">Registration fee</span>
            <span className="font-display text-[24px] font-semibold leading-none text-[var(--fg)]">{priceLabel(event.fee)}</span>
            {event.memberFee > 0 && event.memberFee < event.fee && (
              <span className="ml-2 text-[12px] text-gold">{priceLabel(event.memberFee)} members</span>
            )}
          </div>
          {registerable ? (
            <Link
              href={`/events/${event.slug}/register`}
              className="relative z-10 inline-flex h-11 items-center gap-1.5 rounded-full bg-grad-primary px-5 text-[13.5px] font-semibold text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110"
            >
              <Ticket className="h-4 w-4" aria-hidden />
              Register Now
            </Link>
          ) : (
            <Link
              href={`/events/${event.slug}`}
              className="relative z-10 inline-flex h-11 items-center gap-1.5 rounded-full border border-mist/[0.16] px-5 text-[13.5px] font-semibold text-[var(--fg)]"
            >
              Details <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
