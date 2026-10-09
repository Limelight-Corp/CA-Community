import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readPrivate } from '../../../lib/community-store';
import { updateMember } from '../../../lib/admin-data';
import { externalUrl, issuesToFieldErrors } from '../../../lib/content-validation';
import { byNewest, filterMembers } from '../../../lib/filters';
import { bad, handleError, isPlainObject } from '../../../lib/api-helpers';

/** Membership applications (private data). Protected by the admin access gate; no CORS. */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const rows = filterMembers(readPrivate().members, {
      q: sp.get('q') ?? undefined,
      plan: sp.get('plan') ?? undefined,
      status: sp.get('status') ?? undefined,
      city: sp.get('city') ?? undefined,
    }).sort(byNewest);
    return NextResponse.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    return handleError(error, 'Members GET');
  }
}

/** Whitelisted, editable fields of an application. */
const memberUpdateSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120),
    email: z.string().trim().email('Enter a valid email').max(200),
    mobile: z.string().trim().min(6, 'Enter a valid mobile number').max(20),
    city: z.string().trim().max(120),
    plan: z.enum(['core', 'associate', 'student']),
    membershipNo: z.string().trim().max(40),
    qualificationYear: z.string().trim().max(10),
    areaOfPractice: z.string().trim().max(160),
    organisation: z.string().trim().max(160),
    linkedinUrl: externalUrl,
    status: z.enum(['pending', 'approved', 'rejected']),
  })
  .partial();

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const { id, updates } = body;
    if (typeof id !== 'string' || !id) return bad('Application id is required');
    if (!isPlainObject(updates)) return bad('Updates must be an object');
    const parsed = memberUpdateSchema.safeParse(updates);
    if (!parsed.success) {
      const fieldErrors = issuesToFieldErrors(parsed.error);
      return bad(Object.values(fieldErrors)[0] ?? 'Invalid data', 422, fieldErrors);
    }
    const item = updateMember(id, parsed.data);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return handleError(error, 'Members PATCH');
  }
}
