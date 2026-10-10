import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { CommunityEvent } from '@ascend/shared';
import { getItems } from '../../../../lib/community-store';
import { formatEventDate, isUpcoming } from '../../../../lib/events';
import { certificatePdfPath, isCertificateValid } from '../../../../lib/certificates';
import { clientIp, findRegistrationWithToken, rateLimit } from '../../registrations/_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  items: z.array(z.object({ bookingId: z.string().trim().min(1).max(60), accessToken: z.string().trim().min(1).max(200) })).max(30),
});

export type CertificateStatus = 'ready' | 'awaiting_event' | 'not_checked_in' | 'not_eligible';

/**
 * POST { items: [{ bookingId, accessToken }] } — bookings remembered on this device.
 * Only bookings whose token matches are returned, so nobody can list someone else's certificates.
 */
export async function POST(req: Request) {
  if (!rateLimit(`certlookup:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  const events = getItems<CommunityEvent>('events');
  const out = [];
  for (const { bookingId, accessToken } of parsed.data.items) {
    const reg = findRegistrationWithToken(bookingId, accessToken);
    if (!reg) continue;
    const event = events.find((e) => e.id === reg.eventId);
    const status: CertificateStatus = isCertificateValid(reg)
      ? 'ready'
      : reg.status !== 'confirmed'
        ? 'not_eligible'
        : event && isUpcoming(event)
          ? 'awaiting_event'
          : 'not_checked_in';
    out.push({
      bookingId: reg.bookingId,
      eventTitle: reg.eventTitle,
      eventSlug: reg.eventSlug,
      dateLabel: event ? formatEventDate(event, { day: 'numeric', month: 'short', year: 'numeric' }) : '',
      cpeHours: event?.cpeHours && event.cpeHours > 0 ? event.cpeHours : undefined,
      status,
      certificateId: status === 'ready' ? reg.certificateId : undefined,
      downloadUrl: status === 'ready' ? certificatePdfPath(reg.certificateId!, accessToken) : undefined,
      verifyPath: status === 'ready' ? `/verify/${reg.certificateId}` : undefined,
    });
  }
  return NextResponse.json({ items: out }, { headers: { 'Cache-Control': 'no-store' } });
}
