import { NextResponse } from 'next/server';
import { getSettings } from '../../../../../lib/community-store';
import { buildMembershipReceiptPdf } from '../../../../../lib/receipts';
import { membershipFor } from '../../../../../lib/member-accounts';
import { planName } from '../../../../../lib/membership';
import { memberFromRequest } from '../../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/membership/receipt/<MEM-…> → PDF receipt, for the member who owns it. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const account = memberFromRequest(req);
  const { id } = await params;
  const app = account ? membershipFor(account) : undefined;
  const payment = app?.payments?.find((p) => p.id === decodeURIComponent(id));
  if (!app || !payment) return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
  const pdf = await buildMembershipReceiptPdf(app, payment, planName(app.plan), getSettings());
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="membership-receipt-${payment.id}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
