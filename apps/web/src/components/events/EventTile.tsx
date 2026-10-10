import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Clock, MapPin, Wifi } from 'lucide-react';
import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';
import { cn } from '@ascend/ui';
import { FxCard } from '../home/Interactive';
import { canRegister, dateParts, eventStatus, locationLabel, priceLabel, seatsLeft, STATUS_LABEL, type EventStatus } from '../../lib/events';
import { safeUrl } from '../../lib/content';

const STATUS_STYLE: Record<EventStatus, string> = {
  open: 'text-ok border-ok/35 bg-ok/15',
  filling: 'text-warn border-warn/35 bg-warn/15',
  soldout: 'text-bad border-bad/35 bg-bad/15',
  closed: 'text-[var(--muted)] border-mist/20 bg-mist/10',
  past: 'text-[var(--muted)] border-mist/20 bg-mist/10',
  cancelled: 'text-bad border-bad/35 bg-bad/15',
};

export interface EventTileProps {
  event: CommunityEvent;
  wing?: CommunityWing;
  speakers?: CommunitySpeaker[];
  className?: string;
  priority?: boolean;
}

const initials = (name: string) =>
  name
    .replace(/^CA\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();

/** Circular seat gauge: share of seats already taken. */
function SeatRing({ taken, tone }: { taken: number; tone: string }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 shrink-0 -rotate-90" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-mist/[0.12]" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        className="pass-ring-fill"
        stroke={tone}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(taken, 4) / 100)}
      />
    </svg>
  );
}

/**
 * Event card (Website Checklist §4) styled as a holographic event pass: name, banner, date,
 * time, venue, online/offline, speakers, fee, seats available, status and Register Now.
 */
export function EventTile({ event, wing, speakers = [], className }: EventTileProps) {
  const status = eventStatus(event);
  const d = dateParts(event);
  const left = seatsLeft(event);
  const accent = wing?.color || 'var(--brand-500)';
  const registerable = canRegister(event);
  const taken = event.seatsTotal > 0 ? Math.min(100, Math.max(0, ((event.seatsTotal - left) / event.seatsTotal) * 100)) : 0;
  const image = safeUrl(event.imageUrl);
  const live = status === 'open' || status === 'filling';
  const ringTone = status === 'filling' || status === 'soldout' ? 'rgb(var(--gold-rgb))' : accent;

  return (
    <FxCard
      as="article"
      max={6}
      className={cn('event-pass group flex min-w-0 flex-col rounded-[30px]', className)}
      style={{ ['--pass-accent' as string]: accent } as React.CSSProperties}
    >
      <div className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-[30px] border border-mist/[0.1] bg-[linear-gradient(180deg,rgb(var(--mist-rgb)/0.05),rgb(var(--mist-rgb)/0.015))] backdrop-blur-sm">
        {/* ---------------------------------------------------------------- Banner */}
        <Link href={`/events/${event.slug}`} tabIndex={-1} aria-hidden className="relative block h-48 overflow-hidden">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.07]" loading="lazy" />
          ) : (
            <div className="grain absolute inset-0 bg-brand-950">
              <div
                className="mesh-drift"
                style={{
                  background: `radial-gradient(55% 65% at 85% 10%, color-mix(in srgb, ${accent} 85%, transparent) 0%, transparent 70%), radial-gradient(45% 55% at 5% 100%, rgb(var(--gold-rgb) / 0.32), transparent 70%), linear-gradient(160deg, var(--brand-800), var(--brand-950) 70%)`,
                }}
              />
              <div
                className="pass-glow absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-60 blur-3xl"
                style={{ background: `color-mix(in srgb, ${accent} 70%, transparent)` }}
              />
              <span className="fx-ghost text-outline pointer-events-none absolute -bottom-10 -right-3 select-none font-display text-[170px] font-semibold leading-none tracking-[-0.07em] opacity-50">
                {d.day}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/10 to-transparent" />
          <span className="pass-shine" />

          {/* Top row: category / mode · status */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/90 backdrop-blur-md">
                {event.category}
              </span>
            </div>
            <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] backdrop-blur-md', STATUS_STYLE[status])}>
              {live && <span className="pass-live-dot h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
              {STATUS_LABEL[status]}
            </span>
          </div>

          {/* Bottom strip: date stamp + wing */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <span className="flex items-stretch overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md">
              <span className="flex flex-col items-center justify-center bg-white/10 px-3 py-1.5">
                <span className="font-display text-[22px] font-semibold leading-none text-white">{d.day}</span>
                <span className="mt-0.5 font-mono text-[9.5px] tracking-[0.16em] text-gold">{d.month}</span>
              </span>
              <span className="flex flex-col justify-center px-3 py-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/60">
                  {d.weekday} · {d.year}
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-white">
                  <Clock className="h-3.5 w-3.5 text-gold" aria-hidden /> {event.time}
                </span>
              </span>
            </span>
            {wing && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full" style={{ background: wing.color, boxShadow: `0 0 10px ${wing.color}` }} aria-hidden />
                Wing {String(wing.number).padStart(2, '0')}
              </span>
            )}
          </div>
        </Link>

        <div className="px-6">
          <div className="ticket-cut" aria-hidden />
        </div>

        {/* ---------------------------------------------------------------- Body */}
        <div className="flex flex-1 flex-col gap-4 p-6 pt-5">
          <h3 className="line-clamp-2 font-display text-[22px] font-medium leading-[1.12] tracking-[-0.025em] text-[var(--fg)] transition-colors group-hover:text-gold-soft">
            <Link href={`/events/${event.slug}`} className="after:absolute after:inset-0 after:z-[1] after:content-[''] focus:outline-none">
              {event.title}
            </Link>
          </h3>

          <p className="flex min-w-0 items-center gap-2 text-[13.5px] text-[var(--muted)]">
            {event.mode === 'Online' ? (
              <Wifi className="h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden />
            ) : (
              <MapPin className="h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden />
            )}
            <span className="truncate">{event.mode === 'Online' ? 'Online event' : locationLabel(event)}</span>
          </p>

          {speakers.length > 0 && (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex shrink-0 -space-x-2">
                {speakers.slice(0, 3).map((s) => {
                  const src = safeUrl(s.avatarUrl);
                  return src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s.slug} src={src} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-bg" />
                  ) : (
                    <span key={s.slug} className="grid h-8 w-8 place-items-center rounded-full bg-grad-primary text-[10.5px] font-semibold text-white ring-2 ring-bg">
                      {initials(s.name)}
                    </span>
                  );
                })}
              </span>
              <span className="min-w-0 truncate text-[13px] text-[var(--fg-soft)]">
                {speakers.map((s) => s.name).join(', ')}
              </span>
            </div>
          )}

          {status !== 'past' && event.seatsTotal > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-mist/[0.08] bg-mist/[0.03] px-3 py-2.5">
              <SeatRing taken={taken} tone={ringTone} />
              <div className="min-w-0 leading-tight">
                <p className="text-[14px] font-semibold text-[var(--fg)]">
                  {left.toLocaleString('en-IN')} seat{left === 1 ? '' : 's'} left
                </p>
                <p className="text-[12px] text-[var(--muted)]">of {event.seatsTotal.toLocaleString('en-IN')} · {Math.round(taken)}% booked</p>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- Footer */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-1">
            <div className="min-w-0">
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Fee</span>
              <span className="font-display text-[28px] font-semibold leading-none tracking-[-0.03em] text-[var(--fg)]">{priceLabel(event.fee)}</span>
              {event.memberFee > 0 && event.memberFee < event.fee && (
                <span className="mt-1 block text-[11.5px] font-medium text-gold">{priceLabel(event.memberFee)} for members</span>
              )}
            </div>
            <Link
              href={registerable ? `/events/${event.slug}/register` : `/events/${event.slug}`}
              className={cn(
                'pass-cta relative z-10 inline-flex h-12 shrink-0 items-center gap-2 whitespace-nowrap rounded-full pl-5 pr-1.5 text-[14px] font-semibold transition',
                registerable
                  ? 'btn-shimmer bg-grad-primary text-white shadow-[0_14px_34px_-14px_rgb(var(--lime-rgb)/0.95)] hover:brightness-110'
                  : 'border border-mist/[0.16] text-[var(--fg)] hover:border-mist/40'
              )}
            >
              {registerable ? 'Register' : 'Details'}
              <span className={cn('pass-cta-arrow grid h-9 w-9 place-items-center rounded-full', registerable ? 'bg-white/20' : 'bg-mist/[0.08]')}>
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </FxCard>
  );
}
