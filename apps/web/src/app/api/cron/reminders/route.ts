import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { sendDueReminders, sendMembershipRenewalReminders } from '../../../../lib/reminders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sends due event reminders. For an external scheduler (e.g. Vercel Cron, which sends
 * `Authorization: Bearer <CRON_SECRET>`). Disabled unless CRON_SECRET is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 });
  const given = Buffer.from(req.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, ...sendDueReminders(), renewals: sendMembershipRenewalReminders().sent }, { headers: { 'Cache-Control': 'no-store' } });
}
