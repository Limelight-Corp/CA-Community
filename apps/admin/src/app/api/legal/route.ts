import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LEGAL_SLUGS, legalTextToSections } from '@ascend/shared';
import { store } from '../../../lib/community-store';
import { issuesToFieldErrors } from '../../../lib/content-validation';
import { bad, handleError, isPlainObject } from '../../../lib/api-helpers';

/**
 * Legal pages (privacy, terms, event terms, refund, payment, cookies). PUT saves the admin's
 * wording for one page; DELETE ?slug= goes back to the default draft. Admin gate protected.
 */
export const dynamic = 'force-dynamic';

const slug = z.enum(LEGAL_SLUGS as [string, ...string[]], { message: 'Unknown legal page' });

const legalSchema = z
  .object({
    slug,
    title: z.string().trim().min(1, 'Title is required').max(120, 'Keep the title under 120 characters'),
    summary: z.string().trim().min(1, 'Summary is required').max(400, 'Keep the summary under 400 characters'),
    content: z
      .string()
      .trim()
      .min(1, 'The page needs some text')
      .max(60_000, 'Keep the page under 60,000 characters')
      .refine((v) => legalTextToSections(v).some((s) => s.heading && s.body.length > 0), 'Add at least one "## Heading" followed by a paragraph'),
  })
  .strict();

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const parsed = legalSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = issuesToFieldErrors(parsed.error);
      return bad(Object.values(fieldErrors)[0] ?? 'Invalid legal page', 422, fieldErrors);
    }
    const data = await store.saveLegalDocument(parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error, 'Legal PUT');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const parsed = slug.safeParse(request.nextUrl.searchParams.get('slug'));
    if (!parsed.success) return bad('Unknown legal page', 404);
    await store.deleteLegalDocument(parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Legal DELETE');
  }
}
