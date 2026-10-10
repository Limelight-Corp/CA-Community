import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { membershipFeeFor } from '@ascend/shared';
import { getSettings, readPrivate } from '../../../../../lib/community-store';
import { recordOfflineMembershipPayment } from '../../../../../lib/admin-data';
import { notifyMembershipPaidOffline } from '../../../../../lib/notifications';
import { bad, handleError } from '../../../../../lib/api-helpers';
import { SESSION_COOKIE, verifySessionToken } from '../../../../../lib/admin-session';

export const dynamic = 'force-dynamic';

const Body = z.object({ amount: z.number().int().min(0).max(1_000_000).optional() });

/** POST — records an offline membership payment (cash / bank transfer / complimentary = 0). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = Body.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return bad('Enter a valid amount', 422);
    const app = readPrivate().members.find((m) => m.id === id);
    if (!app) return bad('Application not found', 404);
    const admin = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    const amount = parsed.data.amount ?? membershipFeeFor(app.plan, getSettings());
    const result = recordOfflineMembershipPayment(id, amount, admin?.username ?? 'admin');
    notifyMembershipPaidOffline(result.app, result.payment, result.renewal);
    return NextResponse.json({ success: true, item: result.app, payment: result.payment });
  } catch (error) {
    return handleError(error, 'Membership payment');
  }
}
