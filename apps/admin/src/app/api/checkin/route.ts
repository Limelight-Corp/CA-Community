import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkIn, checkinStats } from '../../../lib/checkin';
import { handleError } from '../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

const Body = z.object({
  code: z.string().max(300).optional(),
  bookingId: z.string().max(60).optional(),
  eventId: z.string().max(80).optional(),
});

/** POST { code? | bookingId?, eventId? } → check-in result. */
export async function POST(request: NextRequest) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
    const result = checkIn(parsed.data);
    const stats = parsed.data.eventId ? checkinStats(parsed.data.eventId) : undefined;
    return NextResponse.json({ success: true, data: { ...result, stats } });
  } catch (error) {
    return handleError(error, 'Check-in');
  }
}

/** GET ?eventId= → { confirmed, checkedIn, recent }. */
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get('eventId');
  if (!eventId) return NextResponse.json({ success: false, error: 'eventId is required' }, { status: 400 });
  return NextResponse.json({ success: true, data: checkinStats(eventId) }, { headers: { 'Cache-Control': 'no-store' } });
}
