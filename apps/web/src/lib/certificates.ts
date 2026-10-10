/**
 * Attendance certificates (server-only).
 * A certificate exists for a confirmed registration once the attendee is checked in (admin →
 * Registrations → Present), which issues `certificateId`. The PDF carries a QR code that opens
 * the public /verify/<certificateId> page.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import QRCode from 'qrcode';
import type { CommunityEvent, CommunityRegistration } from '@ascend/shared';
import { getItems, readPrivate } from './community-store';
import { formatEventDate, locationLabel } from './events';
import { siteUrl } from './seo';

export interface CertificateRecord {
  reg: CommunityRegistration;
  event?: CommunityEvent;
}

export function isCertificateValid(reg: CommunityRegistration): boolean {
  return reg.status === 'confirmed' && !!reg.attended && !!reg.certificateId;
}

export function findCertificate(certificateId: string): CertificateRecord | undefined {
  if (!/^ASC-CERT-[A-Z0-9]{6,12}$/.test(certificateId)) return undefined;
  const reg = readPrivate().registrations.find((r) => r.certificateId === certificateId);
  if (!reg) return undefined;
  const event = getItems<CommunityEvent>('events').find((e) => e.id === reg.eventId);
  return { reg, event };
}

export const verifyUrl = (certificateId: string) => `${siteUrl()}/verify/${certificateId}`;
export const certificatePdfPath = (certificateId: string, token: string) =>
  `/api/certificates/${encodeURIComponent(certificateId)}/pdf?t=${encodeURIComponent(token)}`;

/** Standard PDF fonts only cover Windows-1252; replace anything else so generation never fails. */
const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export function safe(text: string): string {
  return Array.from(text)
    .map((c) => (c.charCodeAt(0) <= 0xff || CP1252_EXTRA.has(c) ? c : c === '₹' ? 'Rs.' : '?'))
    .join('');
}

function fitSize(font: PDFFont, text: string, maxWidth: number, start: number, min: number): number {
  let size = start;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

export async function buildCertificatePdf(record: CertificateRecord, siteName: string): Promise<Uint8Array> {
  const { reg, event } = record;
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate — ${reg.name} — ${reg.eventTitle}`);
  doc.setAuthor(siteName);
  doc.setSubject('Certificate of participation');

  const W = 842;
  const H = 595; // A4 landscape
  const page = doc.addPage([W, H]);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBoldItalic);
  const serifIt = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const navy = rgb(0.04, 0.09, 0.27);
  const blue = rgb(0.18, 0.43, 0.89);
  const gold = rgb(0.78, 0.6, 0.24);
  const ink = rgb(0.13, 0.15, 0.22);
  const muted = rgb(0.42, 0.45, 0.53);

  // Frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  page.drawRectangle({ x: 0, y: H - 14, width: W, height: 14, color: navy });
  page.drawRectangle({ x: 0, y: 0, width: W, height: 14, color: navy });
  page.drawRectangle({ x: 0, y: H - 18, width: W, height: 4, color: gold });
  page.drawRectangle({ x: 0, y: 14, width: W, height: 4, color: gold });
  page.drawRectangle({ x: 28, y: 32, width: W - 56, height: H - 64, borderColor: gold, borderWidth: 1 });
  page.drawRectangle({ x: 34, y: 38, width: W - 68, height: H - 76, borderColor: navy, borderWidth: 0.6, opacity: 0 });

  const centre = (text: string, y: number, font: PDFFont, size: number, color = ink) => {
    const t = safe(text);
    page.drawText(t, { x: (W - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });
  };

  // Header
  centre(siteName.toUpperCase().split('').join(' '), H - 78, sansBold, 15, navy);
  centre('A Professional Community for Chartered Accountants & Beyond', H - 96, sans, 9.5, muted);
  centre('CERTIFICATE OF PARTICIPATION', H - 150, sansBold, 26, gold);
  page.drawRectangle({ x: W / 2 - 60, y: H - 164, width: 120, height: 1.5, color: blue });

  centre('This is to certify that', H - 200, serifIt, 15, muted);
  const name = safe(reg.name);
  const nameSize = fitSize(serif, name, W - 200, 40, 22);
  centre(name, H - 248, serif, nameSize, navy);
  page.drawRectangle({ x: W / 2 - 180, y: H - 260, width: 360, height: 0.8, color: gold });
  if (reg.membershipNo) centre(`Membership / Registration No. ${reg.membershipNo}`, H - 278, sans, 10, muted);

  centre('has attended', H - 304, serifIt, 14, muted);
  const title = safe(reg.eventTitle);
  centre(title, H - 334, sansBold, fitSize(sansBold, title, W - 180, 22, 13), ink);
  const when = event ? formatEventDate(event, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const where = event ? locationLabel(event) : '';
  centre([when, where].filter(Boolean).join('  ·  '), H - 358, sans, 11.5, muted);
  if (event?.cpeHours && event.cpeHours > 0) {
    const label = `CPE / learning hours: ${event.cpeHours}`;
    const w = sansBold.widthOfTextAtSize(label, 11) + 28;
    page.drawRectangle({ x: (W - w) / 2, y: H - 392, width: w, height: 22, color: rgb(0.98, 0.95, 0.88), borderColor: gold, borderWidth: 0.8 });
    centre(label, H - 385, sansBold, 11, navy);
  }

  // Footer: ID + issue date (left), issuer (centre), QR (right)
  const issued = new Date(reg.attendedAt ?? reg.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  page.drawText('CERTIFICATE ID', { x: 64, y: 112, size: 8, font: sansBold, color: muted });
  page.drawText(safe(reg.certificateId ?? ''), { x: 64, y: 96, size: 12, font: sansBold, color: navy });
  page.drawText('ISSUED ON', { x: 64, y: 76, size: 8, font: sansBold, color: muted });
  page.drawText(safe(issued), { x: 64, y: 62, size: 11, font: sans, color: ink });

  page.drawRectangle({ x: W / 2 - 90, y: 92, width: 180, height: 0.8, color: navy });
  centre(`Issued by ${siteName}`, 76, sansBold, 11, navy);
  centre('Verify this certificate by scanning the QR code', 62, sans, 8.5, muted);

  const url = verifyUrl(reg.certificateId ?? '');
  const qr = await QRCode.toBuffer(url, { errorCorrectionLevel: 'M', margin: 1, width: 300, color: { dark: '#0A1745', light: '#FFFFFF' } });
  const qrImg = await doc.embedPng(qr);
  page.drawImage(qrImg, { x: W - 64 - 86, y: 56, width: 86, height: 86 });
  page.drawText('SCAN TO VERIFY', { x: W - 64 - 86 + 10, y: 46, size: 7, font: sansBold, color: muted });

  return doc.save();
}
