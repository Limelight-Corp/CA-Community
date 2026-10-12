/**
 * Ticket QR for event-day check-in (server-only).
 * The QR carries `ASCEND-CHECKIN:<bookingId>:<checkinCode>`. The check-in code is a separate random
 * secret, so a photo of someone's QR can't open their booking page or download their certificate.
 */
import QRCode from 'qrcode';
import type { CommunityRegistration } from '@ascend/shared';
import { newSecret, store } from './community-store';

export const CHECKIN_PREFIX = 'ASCEND-CHECKIN';

/** Returns the booking's check-in code, creating it for bookings made before codes existed. */
export async function ensureCheckinCode(reg: CommunityRegistration): Promise<string> {
  if (reg.checkinCode) return reg.checkinCode;
  const code = newSecret();
  // Only fills an empty code, so two page loads at once still end up with one code.
  await store.prisma.eventRegistration.updateMany({
    where: { id: reg.id, checkinCodeHash: null },
    data: { checkinCodeHash: store.sha256(code), checkinCodeEnc: store.sealToken(code) },
  });
  return (await store.getRegistration({ id: reg.id }))?.checkinCode ?? '';
}

export function checkinPayload(reg: CommunityRegistration, code: string): string {
  return `${CHECKIN_PREFIX}:${reg.bookingId}:${code}`;
}

/** Inline SVG (dark modules on white) — prints well and scans from a phone screen. */
export async function checkinQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#0A1745', light: '#FFFFFF' } });
}
