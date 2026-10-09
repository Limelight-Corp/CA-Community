'use client';

import React from 'react';
import { ArrowIcon, CalendarIcon, HomeIcon, UserIcon } from './icons';
import { formatInr, cn } from '../utils';

export interface EventCardData {
  id: string;
  slug: string;
  title: string;
  wingNumber: number;
  wingName: string;
  wingColor: string;
  category: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  city: string;
  mode: 'Online' | 'Offline';
  fee: number;
  memberFee: number;
  seatsTotal: number;
  seatsTaken: number;
  imageUrl?: string;
  speakers?: Array<{ name: string }>;
}

export interface EventCardProps {
  event: EventCardData;
  onSelect?: (event: EventCardData) => void;
  onRegister?: (event: EventCardData) => void;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  onRegister,
  className,
}) => {
  const d = new Date(event.date + 'T00:00:00');
  const dayNum = String(d.getDate()).padStart(2, '0');
  const monthStr = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
  const yearStr = d.getFullYear();
  const weekdayStr = d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase();

  const seatsLeft = event.seatsTotal - event.seatsTaken;
  const isSoldOut = seatsLeft <= 0;
  const isFillingFast = !isSoldOut && seatsLeft / event.seatsTotal < 0.15;

  const statusLabel = isSoldOut ? 'Sold out' : isFillingFast ? 'Filling fast' : 'Open';
  const dotColor = isSoldOut ? '#FF9AA3' : isFillingFast ? '#FFD27A' : '#86EBB0';
  const capacityPercent = Math.min(100, (event.seatsTaken / event.seatsTotal) * 100);

  return (
    <article
      tabIndex={0}
      onClick={() => onSelect?.(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect?.(event);
      }}
      className={cn(
        'group relative flex flex-col rounded-[24px] p-2 cursor-pointer isolate transition-all duration-350',
        'border border-transparent bg-origin-border',
        'bg-[linear-gradient(180deg,#0B1335,#070C24)_padding-box,linear-gradient(160deg,rgba(157,182,255,0.55),rgba(219,231,240,0.06)_38%,rgba(219,231,240,0.04)_62%,rgba(47,91,255,0.45))_border-box]',
        'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_30px_60px_-40px_rgba(0,0,0,0.9)]',
        'hover:-translate-y-1.5 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_40px_70px_-36px_rgba(47,91,255,0.75)]',
        className
      )}
      style={{ ['--wc' as any]: event.wingColor }}
    >
      {/* Glossy Top Tile */}
      <div
        className="relative overflow-hidden rounded-[18px] p-[18px_18px_20px] min-h-[168px] flex flex-col justify-between text-white"
        style={{
          background: `radial-gradient(80% 90% at 85% 10%, color-mix(in srgb, ${event.wingColor} 70%, #4A72FF) 0%, transparent 60%), linear-gradient(155deg, #2F5BFF 0%, #0F38C0 38%, #0C1A58 78%, #070C24 100%)`,
        }}
      >
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-luminosity pointer-events-none"
          />
        )}
        <div className="flex justify-between items-start gap-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-full font-mono text-[11px] uppercase tracking-[0.04em] bg-white/12 border border-white/18 backdrop-blur-md">
            {event.mode === 'Online' ? 'Online' : event.city}
          </span>
          <span className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-full font-mono text-[11px] uppercase tracking-[0.04em] bg-white/12 border border-white/18 backdrop-blur-md">
            <i
              className="w-1.5 h-1.5 rounded-full inline-block shadow-sm"
              style={{ backgroundColor: dotColor }}
            />
            {statusLabel}
          </span>
        </div>

        <div className="flex items-end gap-2.5 relative z-10">
          <b className="font-display text-[54px] md:text-[64px] font-light tracking-[-0.06em] leading-[0.8] drop-shadow-md">
            {dayNum}
          </b>
          <span className="font-mono text-[11.5px] leading-[1.35] uppercase text-white/75 pb-1">
            {monthStr} {yearStr}
            <br />
            {weekdayStr} · {event.time}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-[20px_14px_12px] flex flex-col gap-3.5 flex-1 justify-start">
        <span className="flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
          <i
            className="w-[7px] h-[7px] rounded-full inline-block"
            style={{ backgroundColor: event.wingColor, boxShadow: `0 0 10px ${event.wingColor}` }}
          />
          {event.category} · {event.wingName}
        </span>

        <h3 className="font-display text-[20px] font-medium tracking-[-0.02em] leading-[1.28] text-[var(--fg)]">
          {event.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#B9C8EC] py-1 px-2.5 rounded-full bg-[rgba(219,231,240,0.05)] border border-[rgba(219,231,240,0.08)]">
            {event.mode === 'Online' ? <CalendarIcon size={13} /> : <HomeIcon size={13} />}
            {event.venue}
          </span>
          {event.speakers && event.speakers.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#B9C8EC] py-1 px-2.5 rounded-full bg-[rgba(219,231,240,0.05)] border border-[rgba(219,231,240,0.08)]">
              <UserIcon size={13} />
              {event.speakers[0]!.name}
              {event.speakers.length > 1 && ` +${event.speakers.length - 1}`}
            </span>
          )}
        </div>

        {/* Capacity Bar */}
        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="h-1.5 rounded-full bg-[rgba(219,231,240,0.08)] overflow-hidden">
            <i
              className={cn(
                'block h-full rounded-full transition-all duration-300',
                isSoldOut
                  ? 'bg-gradient-to-r from-[#B4364A] to-[#FF9AA3] shadow-[0_0_12px_rgba(255,154,163,0.6)]'
                  : 'bg-gradient-to-r from-[#0F38C0] to-[#6F95FF] shadow-[0_0_12px_rgba(111,149,255,0.8)]'
              )}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[11.5px] text-[var(--muted)]">
            <span>{Math.min(event.seatsTaken, event.seatsTotal)} registered</span>
            <span>{isSoldOut ? 'Waitlist open' : `${seatsLeft} left`}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="m-[auto_6px_6px] flex justify-between items-center gap-3 p-[12px_12px_12px_16px] rounded-[16px] bg-[rgba(219,231,240,0.04)] border border-[rgba(219,231,240,0.07)]">
        <div>
          <span className="font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--fg)]">
            {formatInr(event.fee)}
          </span>
          <small className="block font-mono text-[12px] text-[var(--muted)]">
            {event.fee === 0
              ? 'For all members'
              : event.memberFee < event.fee
              ? `Members ${formatInr(event.memberFee)}`
              : 'Incl. certificate'}
          </small>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegister?.(event);
          }}
          aria-label={`Register for ${event.title}`}
          className="w-11 h-11 rounded-full bg-gradient-to-b from-[#4A72FF] to-[#0F38C0] text-white flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(47,91,255,0.9)] cursor-pointer border-0 transition-transform group-hover:rotate-[-45deg]"
        >
          <ArrowIcon size={18} />
        </button>
      </div>
    </article>
  );
};
