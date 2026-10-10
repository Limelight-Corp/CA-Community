import { NextResponse } from 'next/server';
import { getSettings } from '../../../../../lib/community-store';
import { buildCertificatePdf, findCertificate, isCertificateValid } from '../../../../../lib/certificates';
import { clientIp, rateLimit, safeEqual } from '../../../registrations/_lib/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/certificates/<certificateId>/pdf?t=<booking access token> → the certificate PDF. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`cert:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again in a few minutes.' }, { status: 429 });
  }
  const { id } = await params;
  const token = new URL(req.url).searchParams.get('t') ?? '';
  const record = findCertificate(decodeURIComponent(id));
  // Same answer for "no such certificate" and "wrong link", so IDs can't be probed.
  if (!record || !isCertificateValid(record.reg) || !safeEqual(record.reg.accessToken, token)) {
    return NextResponse.json({ error: 'Certificate not found.' }, { status: 404 });
  }
  const pdf = await buildCertificatePdf(record, getSettings().siteName);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ASCEND-certificate-${record.reg.certificateId}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
