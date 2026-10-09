/**
 * Pure date/time helpers for events (safe on server and client).
 * Event times are stored as free text ("10:00 AM", "18:30") in India Standard Time.
 */
import type { CommunityEvent } from '@ascend/shared';

const IST_OFFSET_MIN = 330;

/** Parses "10:00 AM", "6 PM", "18:30" into minutes after midnight. */
export function parseTimeOfDay(value?: string): number | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function dateFields(e: Pick<CommunityEvent, 'date'>) {
  const [y, mo, d] = e.date.split('-').map(Number);
  return { y: y || 1970, mo: mo || 1, d: d || 1 };
}

/** Start and end of the event as absolute instants (IST). End defaults to start + 2h. */
export function eventInstants(e: Pick<CommunityEvent, 'date' | 'time' | 'endTime'>): { start: Date; end: Date; allDay: boolean } {
  const { y, mo, d } = dateFields(e);
  const startMin = parseTimeOfDay(e.time);
  const endMin = parseTimeOfDay(e.endTime);
  const base = Date.UTC(y, mo - 1, d) - IST_OFFSET_MIN * 60_000;
  if (startMin === null) {
    return { start: new Date(base), end: new Date(base + 24 * 3600_000), allDay: true };
  }
  const start = new Date(base + startMin * 60_000);
  const end = endMin !== null && endMin > startMin ? new Date(base + endMin * 60_000) : new Date(start.getTime() + 2 * 3600_000);
  return { start, end, allDay: false };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** ISO 8601 with the +05:30 offset, e.g. for JSON-LD and countdowns. */
export function toIstIso(date: Date): string {
  const t = new Date(date.getTime() + IST_OFFSET_MIN * 60_000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:00+05:30`;
}

function icsStamp(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function icsEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export interface IcsInput {
  uid: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  description?: string;
  url?: string;
}

/** Builds a single-event iCalendar file. */
export function buildIcs(input: IcsInput): string {
  const { start, end } = eventInstants(input);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ASCEND//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${icsEscape(input.uid)}`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(input.title)}`,
    `LOCATION:${icsEscape(input.location)}`,
    input.description ? `DESCRIPTION:${icsEscape(input.description)}` : '',
    input.url ? `URL:${input.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

/** Google Maps link: the stored mapUrl, else a search for venue + city. */
export function mapsLink(e: Pick<CommunityEvent, 'mode' | 'mapUrl' | 'venue' | 'city'>): string | null {
  if (e.mapUrl && /^https?:\/\//i.test(e.mapUrl)) return e.mapUrl;
  if (e.mode === 'Online') return null;
  const q = [e.venue, e.city].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
}
