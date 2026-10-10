import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { matchRequest } from '../../../../lib/mentorship';
import { bad, handleError } from '../../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

/** POST { requestId, mentorId } — match a request and email both sides. */
export async function POST(request: NextRequest) {
  try {
    const parsed = z.object({ requestId: z.string().min(1), mentorId: z.string().min(1) }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return bad('Invalid request', 422);
    return NextResponse.json({ success: true, item: matchRequest(parsed.data.requestId, parsed.data.mentorId) });
  } catch (error) {
    return handleError(error, 'Mentorship match');
  }
}
