import { NextRequest, NextResponse } from 'next/server';
import type { CommunityContactMessage } from '@ascend/shared';
import { mutatePrivate, newId } from '../../../lib/community-store';
import { clientIp, HONEYPOT_FIELD, rateLimit, readJsonBody } from '../../../lib/form-guard';
import { contactMessageSchema, fieldErrors } from '../../../lib/form-schemas';

/** Public contact form (Website Checklist §13). Messages go to the PRIVATE store with status "new". */
export async function POST(request: NextRequest) {
  if (!rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000)) {
    return NextResponse.json(
      { success: false, error: 'Too many messages from this connection. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  const body = await readJsonBody(request, 12_000);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const trap = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  if (typeof trap === 'string' && trap.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Please check the highlighted fields.', fieldErrors: fieldErrors(parsed.error) },
      { status: 422 }
    );
  }

  try {
    mutatePrivate((data) => {
      const message: CommunityContactMessage = {
        id: newId('msg'),
        ...parsed.data,
        status: 'new',
        createdAt: new Date().toISOString(),
      };
      data.messages.push(message);
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to save contact message:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong on our side. Please try again shortly.' }, { status: 500 });
  }
}
