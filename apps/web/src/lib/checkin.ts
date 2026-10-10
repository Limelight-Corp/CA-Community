/**
 * Ticket QR for event-day check-in (server-only).
 * The QR carries `ASCEND-CHECKIN:<bookingId>:<checkinCode>`. The check-in code is a separate random
 * secret, so a photo of someone's QR can't open their booking page or download their certificate.
 */
import QRCode from 'qrcode';
import type { CommunityRegistration } from '@ascend/shared';
import { mutatePrivate, newSecret } from './community-store';

export const CHECKIN_PREFIX = 'ASCEND-CHECKIN';

/** Returns the booking's check-in code, creating it for bookings made before codes existed. */
export function ensureCheckinCode(reg: CommunityRegistration): string {
  if (reg.checkinCode) return reg.checkinCode;
  return mutatePrivate((data) => {
    const r = data.registrations.find((x) => x.id === reg.id);
    if (!r) return '';
    if (!r.checkinCode) r.checkinCode = newSecret();
    return r.checkinCode;
  });
}

export function checkinPayload(reg: CommunityRegistration, code: string): string {
  return `${CHECKIN_PREFIX}:${reg.bookingId}:${code}`;
}

/** Inline SVG (dark modules on white) — prints well and scans from a phone screen. */
export async function checkinQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#0A1745', light: '#FFFFFF' } });
}
