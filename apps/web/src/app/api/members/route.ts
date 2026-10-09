import { NextRequest, NextResponse } from 'next/server';
import type { CommunityMemberApplication } from '@ascend/shared';
import { mutatePrivate, newId } from '../../../lib/community-store';
import { clientIp, HONEYPOT_FIELD, rateLimit, readJsonBody } from '../../../lib/form-guard';
import { fieldErrors, memberApplicationSchema } from '../../../lib/form-schemas';

/**
 * Public membership application (Website Checklist §7).
 * Saves to the PRIVATE store with status "pending"; nothing is ever returned except a status message.
 * No payment is taken and no email is sent here — the team follows up after review.
 */
export async function POST(request: NextRequest) {
  if (!rateLimit(`members:${clientIp(request)}`, 5, 10 * 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Too many submissions from this connection. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  const body = await readJsonBody(request);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: bots fill every field. Pretend success so they learn nothing.
  const trap = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof trap === 'string' && trap.trim() !== '') {
    return NextResponse.json({ success: true, status: 'received' });
  }

  const parsed = memberApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Please check the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 }
    );
  }
  const input = parsed.data;

  try {
    const outcome = mutatePrivate((data) => {
      if (data.members.some((m) => m.email.toLowerCase() === input.email)) return 'duplicate' as const;
      const stamp = new Date().toISOString();
      const application: CommunityMemberApplication = {
        id: newId('mem'),
        name: input.name,
        email: input.email,
        mobile: input.mobile,
        city: input.city,
        plan: input.plan,
        membershipNo: input.membershipNo,
        qualificationYear: input.qualificationYear,
        areaOfPractice: input.areaOfPractice,
        organisation: input.organisation,
        linkedinUrl: input.linkedinUrl,
        interests: Array.from(new Set(input.interests)).sort((a, b) => a - b),
        status: 'pending',
        createdAt: stamp,
        updatedAt: stamp,
      };
      data.members.push(application);
      return 'created' as const;
    });

    if (outcome === 'duplicate') {
      return NextResponse.json({
        success: true,
        status: 'duplicate',
        message: 'We have already received an application with this email address. Our team will be in touch — no need to apply again.',
      });
    }
    return NextResponse.json({ success: true, status: 'received' }, { status: 201 });
  } catch (error) {
    console.error('Failed to save membership application:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong on our side. Please try again shortly.' }, { status: 500 });
  }
}
