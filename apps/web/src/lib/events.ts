import type { CommunityEvent, CommunitySpeaker, CommunityWing } from '@ascend/shared';

/** Parses the stored YYYY-MM-DD date as a local calendar day. */
export function eventDate(e: Pick<CommunityEvent, 'date'>): Date {
  const [y, m, d] = e.date.split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

export function isUpcoming(e: CommunityEvent, today = new Date()): boolean {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return eventDate(e).getTime() >= start.getTime();
}

export function sortByDate(events: CommunityEvent[]): CommunityEvent[] {
  return [...events].sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
}

export function seatsLeft(e: CommunityEvent): number {
  return Math.max(0, (e.seatsTotal || 0) - (e.seatsTaken || 0));
}

export type EventStatus = 'open' | 'filling' | 'soldout' | 'closed' | 'past' | 'cancelled';

export function eventStatus(e: CommunityEvent, today = new Date()): EventStatus {
  if (e.cancelledAt) return 'cancelled';
  if (!isUpcoming(e, today)) return 'past';
  if (e.registrationOpen === false) return 'closed';
  const left = seatsLeft(e);
  if (left <= 0) return 'soldout';
  if (e.seatsTotal > 0 && left / e.seatsTotal <= 0.2) return 'filling';
  return 'open';
}

export const STATUS_LABEL: Record<EventStatus, string> = {
  open: 'Registrations open',
  filling: 'Filling fast',
  soldout: 'Sold out',
  closed: 'Registrations closed',
  past: 'Event concluded',
  cancelled: 'Event cancelled',
};

export function canRegister(e: CommunityEvent): boolean {
  const s = eventStatus(e);
  return s === 'open' || s === 'filling';
}

export function priceLabel(amount: number): string {
  return amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Free';
}

export function formatEventDate(e: CommunityEvent, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  return eventDate(e).toLocaleDateString('en-IN', opts);
}

export function dateParts(e: CommunityEvent) {
  const d = eventDate(e);
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('en-IN', { weekday: 'short' }),
    year: d.getFullYear(),
  };
}

export function locationLabel(e: CommunityEvent): string {
  return e.mode === 'Online' ? 'Online' : [e.venue, e.city].filter(Boolean).join(', ');
}

export function eventSpeakers(e: CommunityEvent, speakers: CommunitySpeaker[]): CommunitySpeaker[] {
  return (e.speakerSlugs || [])
    .map((slug) => speakers.find((s) => s.slug === slug))
    .filter((s): s is CommunitySpeaker => !!s);
}

export function eventWing(e: CommunityEvent, wings: CommunityWing[]): CommunityWing | undefined {
  return wings.find((w) => w.number === e.wingNumber);
}

/** Display category: online events surface as "Online". */
export function eventCategory(e: CommunityEvent): string {
  return e.category;
}
