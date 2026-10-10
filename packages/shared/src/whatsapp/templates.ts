/**
 * WhatsApp message templates (checklist §18), shared by the website and the admin console.
 *
 * Businesses may only start WhatsApp conversations with templates pre-approved by Meta. Each
 * template below must be created in WhatsApp Manager with the same name, language and the body
 * text shown in `body` — {{1}}, {{2}}… are filled from `params` in order. See
 * docs/WHATSAPP_SETUP.md. Names can be overridden with WHATSAPP_TPL_<KEY> env variables.
 */
import type { EmailBooking } from '../email/templates';

export type WhatsAppTemplateKey = 'booking_confirmed' | 'event_reminder' | 'event_cancelled' | 'event_updated';

export interface WhatsAppMessage {
  template: WhatsAppTemplateKey;
  /** Body parameters, in {{1}}, {{2}}… order. */
  params: string[];
}

export const WHATSAPP_TEMPLATES: Record<WhatsAppTemplateKey, { category: 'UTILITY'; body: string; params: string[] }> = {
  booking_confirmed: {
    category: 'UTILITY',
    body: 'Hi {{1}}, your registration for {{2}} on {{3}} is confirmed. Booking ID: {{4}}. Your entry pass: {{5}}',
    params: ['Name', 'Event title', 'Date & time', 'Booking ID', 'Booking link'],
  },
  event_reminder: {
    category: 'UTILITY',
    body: 'Hi {{1}}, a reminder that {{2}} is {{3}}. Where: {{4}}. Your booking and entry pass: {{5}}',
    params: ['Name', 'Event title', '"today" or "tomorrow" + time', 'Venue, or online-joining note', 'Booking link'],
  },
  event_cancelled: {
    category: 'UTILITY',
    body: 'Hi {{1}}, we are sorry — {{2}} scheduled for {{3}} has been cancelled. {{4}} Booking ID: {{5}}',
    params: ['Name', 'Event title', 'Original date', 'Organisers’ note or payment note', 'Booking ID'],
  },
  event_updated: {
    category: 'UTILITY',
    body: 'Hi {{1}}, the details of {{2}} have changed: {{3}}. Your booking {{4}} stays valid. Details: {{5}}',
    params: ['Name', 'Event title', 'What changed', 'Booking ID', 'Booking link'],
  },
};

/**
 * WhatsApp rejects parameters with new lines, tabs or more than four spaces in a row, and
 * empty values. Normalises a value so the API accepts it.
 */
export function waParam(value: string | undefined, fallback = '—'): string {
  const v = (value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, 900);
  return v || fallback;
}

/**
 * Indian mobile number in WhatsApp's international format (e.g. "919876543210"), or null when
 * the number can't be used. Accepts 10-digit numbers, +91 / 91 / 0 prefixes, spaces and dashes.
 */
export function waNumber(mobile: string | undefined): string | null {
  const d = (mobile ?? '').replace(/\D/g, '');
  const ten = d.length === 10 ? d : d.length === 11 && d.startsWith('0') ? d.slice(1) : d.length === 12 && d.startsWith('91') ? d.slice(2) : null;
  return ten && /^[6-9]\d{9}$/.test(ten) ? `91${ten}` : null;
}

export function waBookingConfirmed(b: EmailBooking): WhatsAppMessage {
  return { template: 'booking_confirmed', params: [waParam(b.name), waParam(b.eventTitle), waParam(b.when, 'the scheduled date'), waParam(b.bookingId), waParam(b.bookingUrl)] };
}

export function waEventReminder(b: EmailBooking, today: boolean, time?: string): WhatsAppMessage {
  const where = !b.where || b.where === 'Online' ? 'Online — the joining details are on your booking page' : b.where;
  return {
    template: 'event_reminder',
    params: [waParam(b.name), waParam(b.eventTitle), waParam(`${today ? 'today' : 'tomorrow'}${time ? ` at ${time}` : ''}`), waParam(where), waParam(b.bookingUrl)],
  };
}

export function waEventCancelled(b: EmailBooking, note: string | undefined, paid: boolean): WhatsAppMessage {
  const extra = [note, paid ? 'Our team will contact you about your payment.' : ''].filter(Boolean).join(' ');
  return { template: 'event_cancelled', params: [waParam(b.name), waParam(b.eventTitle), waParam(b.when, 'the scheduled date'), waParam(extra, 'More details have been sent by email.'), waParam(b.bookingId)] };
}

export function waEventUpdated(b: EmailBooking, changes: { label: string; to: string }[]): WhatsAppMessage {
  return {
    template: 'event_updated',
    params: [waParam(b.name), waParam(b.eventTitle), waParam(changes.map((c) => `${c.label} now ${c.to}`).join('; ')), waParam(b.bookingId), waParam(b.bookingUrl)],
  };
}
