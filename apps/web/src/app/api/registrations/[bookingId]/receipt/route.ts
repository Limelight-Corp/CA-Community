import { NextResponse } from 'next/server';
import { getSettings } from '../../../../../lib/community-store';
import { buildReceiptPdf, receiptKind } from '../../../../../lib/receipts';
import { clientIp, findEventById, findRegistrationWithToken, rateLimit } from '../../_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/registrations/<bookingId>/receipt?t=<access token> → receipt / confirmation PDF. */
export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  if (!rateLimit(`receipt:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 });
  }
  const { bookingId } = await params;
  const token = new URL(req.url).searchParams.get('t') || '';
  const reg = findRegistrationWithToken(decodeURIComponent(bookingId), token);
  // Same answer for a wrong link and for an unpaid booking.
  if (!reg || !receiptKind(reg)) return NextResponse.json({ error: 'Receipt not available.' }, { status: 404 });

  const pdf = await buildReceiptPdf(reg, findEventById(reg.eventId), getSettings());
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${reg.bookingId}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
