import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readPrivate } from '../../../lib/community-store';
import { applyRegistrationAction, publicRegistration } from '../../../lib/admin-data';
import { byNewest, filterRegistrations } from '../../../lib/filters';
import { bad, handleError, isPlainObject } from '../../../lib/api-helpers';

/**
 * Event registrations (private data). Protected by the admin access gate (src/middleware.ts);
 * no CORS headers. Registrant access tokens are never returned.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = filterRegistrations(readPrivate().registrations, {
      q: sp.get('q') ?? undefined,
      event: sp.get('event') ?? undefined,
      payment: sp.get('payment') ?? undefined,
      status: sp.get('status') ?? undefined,
    }).sort(byNewest);
    return NextResponse.json({ success: true, count: rows.length, data: rows.map(publicRegistration) });
  } catch (error) {
    return handleError(error, 'Registrations GET');
  }
}

const actionSchema = z.discriminatedUnion('action', [
  z.object({ id: z.string().min(1), action: z.literal('mark_paid') }),
  z.object({ id: z.string().min(1), action: z.literal('cancel') }),
  z.object({ id: z.string().min(1), action: z.literal('mark_refunded') }),
  z.object({ id: z.string().min(1), action: z.literal('set_attended'), value: z.boolean() }),
]);

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return bad('Unknown or invalid registration action', 422);
    const { id, ...action } = parsed.data;
    const updated = applyRegistrationAction(id, action);
    return NextResponse.json({ success: true, item: publicRegistration(updated) });
  } catch (error) {
    return handleError(error, 'Registrations PATCH');
  }
}
