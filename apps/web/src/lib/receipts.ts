/**
 * Booking receipts (server-only): a PDF payment receipt for paid bookings, or a registration
 * confirmation for free ones. Only states what the booking record shows — no tax/GST claims.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import type { CommunityEvent, CommunityMemberApplication, CommunityRegistration, MembershipPayment, SiteSettings } from '@ascend/shared';
import { safe } from './certificates';
import { formatEventDate, locationLabel } from './events';
import { siteUrl } from './seo';

export type ReceiptKind = 'paid' | 'refunded' | 'free';

/** Which document a booking gets, or null when there is nothing to issue yet. */
export function receiptKind(reg: CommunityRegistration): ReceiptKind | null {
  if (reg.paymentStatus === 'paid') return 'paid';
  if (reg.paymentStatus === 'refunded') return 'refunded';
  if (reg.fee <= 0 && reg.status === 'confirmed') return 'free';
  return null;
}

export const receiptPdfPath = (bookingId: string, token: string) =>
  `/api/registrations/${encodeURIComponent(bookingId)}/receipt?t=${encodeURIComponent(token)}`;

const inr = (n: number) => `Rs. ${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ist = (iso?: string) =>
  iso ? `${new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST` : '';

export async function buildReceiptPdf(
  reg: CommunityRegistration,
  event: CommunityEvent | undefined,
  settings: Pick<SiteSettings, 'siteName' | 'contact'>,
  opts: { description?: string; meta?: [string, string][]; idLabel?: string } = {}
): Promise<Uint8Array> {
  const kind = receiptKind(reg);
  if (!kind) throw new Error('No receipt for this booking');
  const title = kind === 'free' ? 'Registration confirmation' : 'Payment receipt';

  const doc = await PDFDocument.create();
  doc.setTitle(`${title} — ${reg.bookingId}`);
  doc.setAuthor(settings.siteName);
  doc.setSubject(`${title} for ${reg.eventTitle}`);

  const W = 595;
  const H = 842; // A4 portrait
  const page = doc.addPage([W, H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.09, 0.27);
  const ink = rgb(0.13, 0.15, 0.22);
  const muted = rgb(0.42, 0.45, 0.53);
  const line = rgb(0.86, 0.88, 0.92);
  const white = rgb(1, 1, 1);
  const pale = rgb(0.75, 0.8, 0.9);
  const M = 48;

  const text = (s: string, x: number, y: number, f: PDFFont, size: number, color = ink) =>
    page.drawText(safe(s), { x, y, font: f, size, color });
  const right = (s: string, xRight: number, y: number, f: PDFFont, size: number, color = ink) => {
    const t = safe(s);
    page.drawText(t, { x: xRight - f.widthOfTextAtSize(t, size), y, font: f, size, color });
  };
  /** Wraps text into lines that fit `width`. */
  const wrap = (s: string, f: PDFFont, size: number, width: number) => {
    const out: string[] = [];
    let cur = '';
    for (const word of safe(s).split(/\s+/)) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && f.widthOfTextAtSize(next, size) > width) {
        out.push(cur);
        cur = word;
      } else cur = next;
    }
    if (cur) out.push(cur);
    return out;
  };

  // Header band
  page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: navy });
  text(settings.siteName, M, H - 62, bold, 24, white);
  text(siteUrl().replace(/^https?:\/\//, ''), M, H - 82, font, 10, pale);
  right(title.toUpperCase(), W - M, H - 60, bold, 13, white);
  right(`No. ${reg.bookingId}`, W - M, H - 78, font, 10, pale);

  // Status stamp
  const stamp = kind === 'paid' ? 'PAID' : kind === 'refunded' ? 'REFUNDED' : 'CONFIRMED';
  const stampColor = kind === 'refunded' ? rgb(0.75, 0.25, 0.2) : rgb(0.1, 0.55, 0.3);
  const sw = bold.widthOfTextAtSize(stamp, 12) + 24;
  page.drawRectangle({ x: W - M - sw, y: H - 156, width: sw, height: 24, borderColor: stampColor, borderWidth: 1.5 });
  text(stamp, W - M - sw + 12, H - 149, bold, 12, stampColor);

  // Issued to
  let y = H - 150;
  text('ISSUED TO', M, y, bold, 9, muted);
  y -= 18;
  text(reg.name, M, y, bold, 13);
  for (const l of [reg.organisation, reg.designation, reg.email, reg.mobile, reg.city].filter(Boolean) as string[]) {
    y -= 15;
    text(l, M, y, font, 10.5);
  }

  // Meta
  let my = H - 190;
  const meta: [string, string][] = [
    [opts.idLabel ?? 'Booking ID', reg.bookingId],
    [kind === 'free' ? 'Registered on' : 'Paid on', ist(kind === 'free' ? reg.createdAt : reg.paidAt || reg.updatedAt)],
  ];
  if (kind === 'refunded') meta.push(['Refunded on', ist(reg.refundedAt || reg.updatedAt)]);
  meta.push(...(opts.meta ?? []));
  for (const [k, v] of meta) {
    text(k, 330, my, font, 9.5, muted);
    right(v, W - M, my, bold, 9.5);
    my -= 16;
  }

  // Line item
  y = Math.min(y, my) - 40;
  page.drawRectangle({ x: M, y: y - 6, width: W - 2 * M, height: 24, color: rgb(0.95, 0.96, 0.98) });
  text('DESCRIPTION', M + 10, y + 2, bold, 9, muted);
  right('AMOUNT', W - M - 10, y + 2, bold, 9, muted);
  y -= 30;
  const descLines = wrap(opts.description ?? `Event registration — ${reg.eventTitle}`, bold, 11, 330);
  descLines.forEach((l, i) => text(l, M + 10, y - i * 15, bold, 11));
  right(kind === 'free' ? 'Free' : inr(reg.fee), W - M - 10, y, bold, 11);
  y -= descLines.length * 15;
  if (event) {
    const when = `${formatEventDate(event, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}${event.time ? ` · ${event.time}` : ''}`;
    for (const l of [when, locationLabel(event)].filter(Boolean)) {
      text(l, M + 10, y, font, 10, muted);
      y -= 14;
    }
  }
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: line });
  y -= 22;
  text(kind === 'refunded' ? 'Total paid' : 'Total', M + 10, y, bold, 12);
  right(kind === 'free' ? 'Rs. 0.00' : inr(reg.fee), W - M - 10, y, bold, 14, navy);
  if (kind === 'refunded') {
    y -= 18;
    text('Refunded', M + 10, y, font, 10.5, muted);
    right(`- ${inr(reg.refundAmount ?? reg.fee)}`, W - M - 10, y, font, 10.5, muted);
  }

  // Payment details
  if (kind !== 'free') {
    y -= 46;
    text('PAYMENT DETAILS', M, y, bold, 9, muted);
    const rows: [string, string | undefined][] = [
      ['Method', reg.gatewayPaymentId ? 'Online payment (Razorpay)' : 'Recorded by the organisers'],
      ['Payment ID', reg.gatewayPaymentId],
      ['Order ID', reg.gatewayOrderId],
      ['Refund ID', reg.refundId],
    ];
    for (const [k, v] of rows) {
      if (!v) continue;
      y -= 17;
      text(k, M, y, font, 10, muted);
      text(v, M + 110, y, font, 10);
    }
  }

  // Footer
  page.drawLine({ start: { x: M, y: 92 }, end: { x: W - M, y: 92 }, thickness: 1, color: line });
  text('This is a computer-generated document and does not require a signature.', M, 72, font, 9, muted);
  const contact = [settings.contact?.email, settings.contact?.phone].filter(Boolean).join(' · ');
  if (contact) text(`Questions? ${contact}`, M, 58, font, 9, muted);

  return doc.save();
}

/** PDF receipt for a membership payment (same layout as the event receipt). */
export function buildMembershipReceiptPdf(
  app: CommunityMemberApplication,
  payment: MembershipPayment,
  planLabel: string,
  settings: Pick<SiteSettings, 'siteName' | 'contact'>
): Promise<Uint8Array> {
  const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const asReg: CommunityRegistration = {
    id: payment.id,
    bookingId: payment.id,
    accessToken: '',
    eventId: '',
    eventSlug: '',
    eventTitle: planLabel,
    name: app.name,
    email: app.email,
    mobile: app.mobile,
    city: app.city,
    organisation: app.organisation,
    fee: payment.amount,
    status: 'confirmed',
    paymentStatus: 'paid',
    gatewayOrderId: payment.gatewayOrderId,
    gatewayPaymentId: payment.gatewayPaymentId,
    paidAt: payment.paidAt,
    createdAt: payment.paidAt,
    updatedAt: payment.paidAt,
  };
  return buildReceiptPdf(asReg, undefined, settings, {
    description: `${planLabel} — annual membership (${day(payment.validFrom)} to ${day(payment.validUntil)})`,
    idLabel: 'Receipt no.',
    meta: [['Valid until', day(payment.validUntil)]],
  });
}
