/**
 * Transactional email templates. Pure functions (no Node APIs) so both apps can use them;
 * each app sends them through its own mailer (apps/<app>/src/lib/mailer.ts).
 *
 * Every value from a user or the CMS is HTML-escaped. Copy stays factual: it only states
 * what the system has actually done (registered, paid, cancelled), never promises.
 */

import type { CommunityEvent, CommunityRegistration } from '../data/initial-data';

export interface EmailMessage {
  subject: string;
  html: string;
  text: string;
}

export interface EmailBrand {
  siteName: string;
  /** Public website origin, e.g. https://ascend.example (no trailing slash). */
  siteUrl: string;
  /** Contact address shown in the footer, if configured. */
  contactEmail?: string;
}

/** Booking details as the email needs them (dates/places already formatted for display). */
export interface EmailBooking {
  name: string;
  email: string;
  mobile?: string;
  bookingId: string;
  eventTitle: string;
  /** e.g. "Sat, 14 Nov 2026 · 10:00 AM" */
  when?: string;
  /** e.g. "Online" or "Hotel Taj, Mumbai" */
  where?: string;
  fee: number;
  paymentId?: string;
  /** Display string, e.g. "10 Oct 2026, 2:30 pm" */
  paidAt?: string;
  /** Link to the booking / receipt page (includes the access token). */
  bookingUrl: string;
  /** Link to the payment page (paid bookings only). */
  payUrl?: string;
}

/** Builds the email view of a booking, with links that open it (they carry the access token). */
export function emailBookingFrom(reg: CommunityRegistration, event: CommunityEvent | undefined, siteUrl: string): EmailBooking {
  const q = `?t=${encodeURIComponent(reg.accessToken)}`;
  const id = encodeURIComponent(reg.bookingId);
  let when: string | undefined;
  if (event?.date) {
    const [y, m, d] = event.date.split('-').map(Number);
    const day = new Date(y || 1970, (m || 1) - 1, d || 1).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    when = event.time ? `${day} · ${event.time}` : day;
  }
  const where = event ? (event.mode === 'Online' ? 'Online' : [event.venue, event.city].filter(Boolean).join(', ')) : undefined;
  return {
    name: reg.name,
    email: reg.email,
    mobile: reg.mobile,
    bookingId: reg.bookingId,
    eventTitle: reg.eventTitle,
    when,
    where: where || undefined,
    fee: reg.fee,
    paymentId: reg.gatewayPaymentId,
    paidAt: reg.paidAt
      ? new Date(reg.paidAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })
      : undefined,
    bookingUrl: `${siteUrl}/registration/${id}${q}`,
    payUrl: reg.fee > 0 ? `${siteUrl}/registration/${id}/pay${q}` : undefined,
  };
}

const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function formatInr(amount: number): string {
  return amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : 'Free';
}

type Row = [label: string, value: string | undefined];

function rowsHtml(rows: Row[]): string {
  return rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#5b6478;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;color:#0a1745;font-size:14px;font-weight:600">${esc(v)}</td></tr>`
    )
    .join('');
}

function rowsText(rows: Row[]): string {
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

interface Layout {
  brand: EmailBrand;
  preheader: string;
  heading: string;
  intro: string[];
  rows?: Row[];
  cta?: { label: string; url: string };
  outro?: string[];
}

function render(l: Layout): { html: string; text: string } {
  const rows = l.rows ?? [];
  const html = `<!doctype html><html><body style="margin:0;background:#eef1f7;font-family:Segoe UI,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${esc(l.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0a1745;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px">${esc(l.brand.siteName)}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0a1745">${esc(l.heading)}</h1>
${l.intro.map((p) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#2b3448">${esc(p)}</p>`).join('')}
${rows.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e3e7ef;border-bottom:1px solid #e3e7ef;width:100%">${rowsHtml(rows)}</table>` : ''}
${l.cta ? `<p style="margin:22px 0"><a href="${esc(l.cta.url)}" style="display:inline-block;background:#2f6fe4;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${esc(l.cta.label)}</a></p>` : ''}
${(l.outro ?? []).map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#5b6478">${esc(p)}</p>`).join('')}
</td></tr>
<tr><td style="padding:16px 28px;background:#f6f8fc;color:#7a8396;font-size:12px;line-height:1.6">
${esc(l.brand.siteName)} · <a href="${esc(l.brand.siteUrl)}" style="color:#7a8396">${esc(l.brand.siteUrl.replace(/^https?:\/\//, ''))}</a>${l.brand.contactEmail ? ` · <a href="mailto:${esc(l.brand.contactEmail)}" style="color:#7a8396">${esc(l.brand.contactEmail)}</a>` : ''}
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    l.heading,
    '',
    ...l.intro,
    ...(rows.length ? ['', rowsText(rows)] : []),
    ...(l.cta ? ['', `${l.cta.label}: ${l.cta.url}`] : []),
    ...(l.outro?.length ? ['', ...l.outro] : []),
    '',
    '—',
    `${l.brand.siteName} · ${l.brand.siteUrl}${l.brand.contactEmail ? ` · ${l.brand.contactEmail}` : ''}`,
  ].join('\n');
  return { html, text };
}

const bookingRows = (b: EmailBooking): Row[] => [
  ['Booking ID', b.bookingId],
  ['Event', b.eventTitle],
  ['When', b.when],
  ['Where', b.where],
];

// ---------------------------------------------------------------------------------------------
// Attendee emails
// ---------------------------------------------------------------------------------------------

/** Free registration: confirmed straight away. */
export function registrationConfirmedEmail(brand: EmailBrand, b: EmailBooking): EmailMessage {
  const subject = `You're registered: ${b.eventTitle} (${b.bookingId})`;
  return {
    subject,
    ...render({
      brand,
      preheader: `Booking ${b.bookingId} is confirmed.`,
      heading: "You're registered!",
      intro: [`Hi ${b.name},`, `Your registration for ${b.eventTitle} is confirmed.`],
      rows: [...bookingRows(b), ['Fee', 'Free']],
      cta: { label: 'View booking & entry pass', url: b.bookingUrl },
      outro: ['Show the entry-pass QR on the booking page at the venue. Keep this email — the link above opens your booking.'],
    }),
  };
}

/** Paid registration saved; payment still to be made. */
export function paymentPendingEmail(brand: EmailBrand, b: EmailBooking): EmailMessage {
  return {
    subject: `Complete your payment: ${b.eventTitle} (${b.bookingId})`,
    ...render({
      brand,
      preheader: `Your seat is confirmed once payment of ${formatInr(b.fee)} is received.`,
      heading: 'Your registration is saved',
      intro: [
        `Hi ${b.name},`,
        `We have saved your registration for ${b.eventTitle}. Your seat is confirmed once the payment of ${formatInr(b.fee)} is completed.`,
      ],
      rows: [...bookingRows(b), ['Amount due', formatInr(b.fee)]],
      cta: b.payUrl ? { label: `Pay ${formatInr(b.fee)}`, url: b.payUrl } : { label: 'View booking', url: b.bookingUrl },
    }),
  };
}

/** Payment verified — doubles as the payment receipt. */
export function paymentConfirmedEmail(brand: EmailBrand, b: EmailBooking): EmailMessage {
  return {
    subject: `Payment received — booking confirmed: ${b.eventTitle} (${b.bookingId})`,
    ...render({
      brand,
      preheader: `Payment of ${formatInr(b.fee)} received. Booking ${b.bookingId} is confirmed.`,
      heading: 'Payment received — you’re in!',
      intro: [`Hi ${b.name},`, `We have received your payment and your registration for ${b.eventTitle} is confirmed. Your payment receipt is below.`],
      rows: [...bookingRows(b), ['Amount paid', formatInr(b.fee)], ['Payment ID', b.paymentId], ['Paid on', b.paidAt]],
      cta: { label: 'View receipt & entry pass', url: b.bookingUrl },
      outro: ['Show the entry-pass QR on the booking page at the venue.'],
    }),
  };
}

/** A payment attempt failed; the booking is kept so they can retry. */
export function paymentFailedEmail(brand: EmailBrand, b: EmailBooking): EmailMessage {
  return {
    subject: `Payment not completed: ${b.eventTitle} (${b.bookingId})`,
    ...render({
      brand,
      preheader: 'Your registration is saved — you can retry the payment.',
      heading: 'Your payment did not go through',
      intro: [
        `Hi ${b.name},`,
        `The payment for ${b.eventTitle} was not completed. Your registration is saved, so you can retry without filling the form again. If money was debited, it is usually returned to your account by your bank automatically.`,
      ],
      rows: [...bookingRows(b), ['Amount due', formatInr(b.fee)]],
      cta: { label: 'Retry payment', url: b.payUrl ?? b.bookingUrl },
    }),
  };
}

/** Booking cancelled by the organisers (optionally with a refund recorded). */
export function bookingCancelledEmail(brand: EmailBrand, b: EmailBooking, opts: { refunded?: boolean } = {}): EmailMessage {
  return {
    subject: `Booking cancelled: ${b.eventTitle} (${b.bookingId})`,
    ...render({
      brand,
      preheader: `Booking ${b.bookingId} has been cancelled.`,
      heading: 'Your booking has been cancelled',
      intro: [
        `Hi ${b.name},`,
        `Your registration for ${b.eventTitle} has been cancelled.`,
        ...(opts.refunded ? [`A refund of ${formatInr(b.fee)} has been processed to your original payment method.`] : []),
      ],
      rows: [...bookingRows(b), ...(opts.refunded ? ([['Refund', formatInr(b.fee)]] as Row[]) : [])],
      outro: ['If you did not expect this, reply to this email or contact us.'],
    }),
  };
}

/** Membership application received (it is reviewed by the team). */
export function memberApplicationEmail(brand: EmailBrand, a: { name: string; plan: string }): EmailMessage {
  return {
    subject: `We received your membership application — ${brand.siteName}`,
    ...render({
      brand,
      preheader: 'Your application is with our team for review.',
      heading: 'Application received',
      intro: [`Hi ${a.name},`, `Thank you for applying to join ${brand.siteName}. Your application is with our team for review, and we will get back to you.`],
      rows: [['Plan', a.plan]],
      cta: { label: 'Explore upcoming events', url: `${brand.siteUrl}/events` },
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// Admin notifications
// ---------------------------------------------------------------------------------------------

export function adminNewRegistrationEmail(brand: EmailBrand, b: EmailBooking, adminUrl?: string): EmailMessage {
  const paid = b.fee > 0;
  return {
    subject: `New registration: ${b.name} — ${b.eventTitle}`,
    ...render({
      brand,
      preheader: `${b.bookingId} · ${paid ? 'awaiting payment' : 'free, confirmed'}`,
      heading: 'New event registration',
      intro: [`${b.name} registered for ${b.eventTitle}.`],
      rows: [
        ['Booking ID', b.bookingId],
        ['Name', b.name],
        ['Email', b.email],
        ['Mobile', b.mobile],
        ['Event', b.eventTitle],
        ['Status', paid ? `Awaiting payment of ${formatInr(b.fee)}` : 'Confirmed (free)'],
      ],
      ...(adminUrl ? { cta: { label: 'Open in admin', url: adminUrl } } : {}),
    }),
  };
}

export function adminPaymentReceivedEmail(brand: EmailBrand, b: EmailBooking, adminUrl?: string): EmailMessage {
  return {
    subject: `Payment received ${formatInr(b.fee)}: ${b.name} — ${b.eventTitle}`,
    ...render({
      brand,
      preheader: `${b.bookingId} is now confirmed.`,
      heading: 'Payment received',
      intro: [`${b.name} paid for ${b.eventTitle}. The booking is confirmed.`],
      rows: [
        ['Booking ID', b.bookingId],
        ['Name', b.name],
        ['Email', b.email],
        ['Amount', formatInr(b.fee)],
        ['Payment ID', b.paymentId],
        ['Paid on', b.paidAt],
      ],
      ...(adminUrl ? { cta: { label: 'Open in admin', url: adminUrl } } : {}),
    }),
  };
}

export function adminContactMessageEmail(
  brand: EmailBrand,
  m: { name: string; email: string; phone?: string; subject?: string; message: string },
  adminUrl?: string
): EmailMessage {
  return {
    subject: `New message: ${m.subject || 'Contact form'} — ${m.name}`,
    ...render({
      brand,
      preheader: m.message.slice(0, 120),
      heading: 'New contact message',
      intro: [m.message],
      rows: [
        ['From', m.name],
        ['Email', m.email],
        ['Phone', m.phone],
        ['Subject', m.subject],
      ],
      ...(adminUrl ? { cta: { label: 'Open messages', url: adminUrl } } : {}),
    }),
  };
}

export function adminMemberApplicationEmail(
  brand: EmailBrand,
  a: { name: string; email: string; mobile?: string; city?: string; plan: string },
  adminUrl?: string
): EmailMessage {
  return {
    subject: `New membership application: ${a.name} (${a.plan})`,
    ...render({
      brand,
      preheader: `${a.name} applied for ${a.plan}.`,
      heading: 'New membership application',
      intro: [`${a.name} applied to join and is waiting for review.`],
      rows: [
        ['Name', a.name],
        ['Email', a.email],
        ['Mobile', a.mobile],
        ['City', a.city],
        ['Plan', a.plan],
      ],
      ...(adminUrl ? { cta: { label: 'Review applications', url: adminUrl } } : {}),
    }),
  };
}
