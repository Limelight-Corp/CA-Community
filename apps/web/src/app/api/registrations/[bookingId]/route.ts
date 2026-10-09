import { NextResponse } from 'next/server';
import { clientIp, findRegistrationWithToken, publicRegistration, rateLimit } from '../_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns one registration to the holder of its access token (`?t=`). Never lists. */
export async function GET(req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const notFound = NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  if (!rateLimit(`lookup:${clientIp(req)}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { bookingId } = await params;
  const token = new URL(req.url).searchParams.get('t') || '';
  const reg = findRegistrationWithToken(bookingId.replace(/%2D/gi, '-'), token);
  if (!reg) return notFound;
  return NextResponse.json(
    { registration: publicRegistration(reg) },
    { headers: { 'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex' } }
  );
}
