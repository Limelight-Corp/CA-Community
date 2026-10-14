import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Wifi } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { cn } from '@ascend/ui';
import { canRegister, dateParts, eventStatus, locationLabel, priceLabel, seatsLeft, STATUS_LABEL, type EventStatus } from '../../lib/events';
import { safeUrl } from '../../lib/content';

/** Quiet status label: coloured dot + text on a faint tint. */
const STATUS_STYLE: Record<EventStatus, string> = {
  open: 'text-ok bg-ok/[0.08]',
  filling: 'text-warn bg-warn/[0.1]',
  soldout: 'text-bad bg-bad/[0.08]',
  closed: 'text-[var(--muted)] bg-mist/[0.05]',
  past: 'text-[var(--muted)] bg-mist/[0.05]',
  cancelled: 'text-bad bg-bad/[0.08]',
};

export interface EventTileProps {
  event: CommunityEvent;
  wing?: CommunityWing;
  speakers?: CommunitySpeaker[];
  className?: string;
  priority?: boolean;
}

/**
 * Event card (Website Checklist §4): name, banner, date, time, venue, online/offline, speakers,
 * fee, seats available, registration status and Register Now — in a plain, calm card.
 */
export function EventTile({ event, wing, speakers = [], className }: EventTileProps) {
  const status = eventStatus(event);
  const d = dateParts(event);
  const left = seatsLeft(event);
  const registerable = canRegister(event);
  const taken = event.seatsTotal > 0 ? Math.min(100, Math.max(0, ((event.seatsTotal - left) / event.seatsTotal) * 100)) : 0;
  const image = safeUrl(event.imageUrl);
  const href = `/events/${event.slug}`;

  return (
    <article
      className={cn(
        'group relative flex min-w-0 flex-col rounded-[24px] border border-mist/[0.09] bg-[var(--card)] p-5 transition-[border-color,box-shadow] duration-300 hover:border-mist/[0.16] hover:shadow-[0_18px_40px_-28px_rgb(var(--mist-rgb)/0.35)] md:p-6',
        className
      )}
    >
      {image && (
        <Link href={href} tabIndex={-1} aria-hidden className="-mx-1 -mt-1 mb-5 block overflow-hidden rounded-[18px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="aspect-[16/9] w-full object-cover" loading="lazy" />
        </Link>
      )}

      {/* Category · status */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">{event.category}</span>
        <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium', STATUS_STYLE[status])}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Date */}
      <div className="mt-5 flex items-center gap-4">
        <span className="flex w-14 shrink-0 flex-col items-center rounded-2xl border border-mist/[0.09] py-2">
          <span className="font-display text-[24px] font-semibold leading-none tracking-[-0.03em] text-[var(--fg)]">{d.day}</span>
          <span className="mt-1 font-mono text-[10px] tracking-[0.14em] text-brand-500">{d.month}</span>
        </span>
        <span className="min-w-0 text-[13px] leading-snug text-[var(--muted)]">
          <span className="block text-[var(--fg-soft)]">
            {d.weekday} · {d.year} · {event.time}
          </span>
          {wing && (
            <span className="mt-0.5 inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: wing.color }} aria-hidden />
              Wing {String(wing.number).padStart(2, '0')} · {wing.name}
            </span>
          )}
        </span>
      </div>

      {/* Title + place + speakers */}
      <h3 className="mt-5 line-clamp-2 font-display text-[21px] font-medium leading-[1.15] tracking-[-0.025em] text-[var(--fg)]">
        <Link href={href} className="after:absolute after:inset-0 after:content-[''] focus:outline-none group-hover:text-brand-500">
          {event.title}
        </Link>
      </h3>
      <p className="mt-2.5 flex min-w-0 items-center gap-2 text-[13.5px] text-[var(--muted)]">
        {event.mode === 'Online' ? <Wifi className="h-4 w-4 shrink-0" aria-hidden /> : <MapPin className="h-4 w-4 shrink-0" aria-hidden />}
        <span className="truncate">{event.mode === 'Online' ? 'Online event' : locationLabel(event)}</span>
      </p>
      {speakers.length > 0 && (
        <p className="mt-1.5 truncate text-[13px] text-[var(--muted)]">
          With <span className="text-[var(--fg-soft)]">{speakers.map((s) => s.name).join(', ')}</span>
        </p>
      )}

      {/* Seats */}
      {status !== 'past' && event.seatsTotal > 0 && (
        <div className="mt-5">
          <div className="h-1 overflow-hidden rounded-full bg-mist/[0.08]" aria-hidden>
            <div
              className={cn('h-full rounded-full', status === 'filling' || status === 'soldout' ? 'bg-gold' : 'bg-brand-500')}
              style={{ width: `${Math.max(taken, 3)}%` }}
            />
          </div>
          <p className="mt-2 text-[12.5px] text-[var(--muted)]">
            <span className="font-medium text-[var(--fg)]">
              {left.toLocaleString('en-IN')} seat{left === 1 ? '' : 's'} left
            </span>{' '}
            of {event.seatsTotal.toLocaleString('en-IN')}
          </p>
        </div>
      )}

      {/* Fee + action (the spacer pins it to the bottom of equal-height cards) */}
      <div className="min-h-5 flex-1" aria-hidden />
      <div className="flex items-end justify-between gap-3 border-t border-mist/[0.08] pt-5">
        <div className="min-w-0">
          <span className="font-display text-[24px] font-semibold leading-none tracking-[-0.03em] text-[var(--fg)]">{priceLabel(event.fee)}</span>
          {event.memberFee > 0 && event.memberFee < event.fee && (
            <span className="mt-1 block text-[12px] text-[var(--muted)]">{priceLabel(event.memberFee)} for members</span>
          )}
        </div>
        <Link
          href={registerable ? `${href}/register` : href}
          className={cn(
            'relative z-10 inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold transition',
            registerable ? 'bg-brand-500 text-white hover:bg-brand-600' : 'border border-mist/[0.16] text-[var(--fg)] hover:border-mist/40'
          )}
        >
          {registerable ? 'Register' : 'Details'}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}
