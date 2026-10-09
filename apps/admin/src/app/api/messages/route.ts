import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readPrivate } from '../../../lib/community-store';
import { updateMessageStatus } from '../../../lib/admin-data';
import { byNewest } from '../../../lib/filters';
import { bad, handleError, isPlainObject } from '../../../lib/api-helpers';

/** Contact form submissions (private data). Protected by the admin access gate; no CORS. */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = [...readPrivate().messages].sort(byNewest);
    return NextResponse.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return handleError(error, 'Messages GET');
  }
}

const schema = z.object({ id: z.string().min(1), status: z.enum(['new', 'read', 'archived']) });

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const parsed = schema.safeParse(body);
    if (!parsed.success) return bad('A message id and a valid status are required', 422);
    const item = updateMessageStatus(parsed.data.id, parsed.data.status);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return handleError(error, 'Messages PATCH');
  }
}
