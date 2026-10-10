import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { setMentorStatus } from '../../../../lib/mentorship';
import { bad, handleError } from '../../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

/** PATCH { id, status } — approve / pause / reject a mentor. */
export async function PATCH(request: NextRequest) {
  try {
    const parsed = z.object({ id: z.string().min(1), status: z.enum(['pending', 'approved', 'paused', 'rejected']) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return bad('Invalid request', 422);
    return NextResponse.json({ success: true, item: setMentorStatus(parsed.data.id, parsed.data.status) });
  } catch (error) {
    return handleError(error, 'Mentor status');
  }
}
