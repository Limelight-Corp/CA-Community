import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setRequestStatus } from '../../../../lib/mentorship';
import { bad, handleError } from '../../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

/** PATCH { id, status: open|closed|declined, note? } */
export async function PATCH(request: NextRequest) {
  try {
    const parsed = z
      .object({ id: z.string().min(1), status: z.enum(['open', 'closed', 'declined']), note: z.string().trim().max(500).optional() })
      .safeParse(await request.json().catch(() => null));
    if (!parsed.success) return bad('Invalid request', 422);
    return NextResponse.json({ success: true, item: setRequestStatus(parsed.data.id, parsed.data.status, parsed.data.note) });
  } catch (error) {
    return handleError(error, 'Mentorship request');
  }
}
