import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSettings, updateSettings } from '../../../lib/community-store';
import { externalUrl, issuesToFieldErrors } from '../../../lib/content-validation';
import { bad, handleError, isPlainObject } from '../../../lib/api-helpers';

/** Site settings (hero banner texts, announcement, contact, social links). Admin gate protected. */
export const dynamic = 'force-dynamic';

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters`);

const settingsSchema = z
  .object({
    siteName: text(80).min(1, 'Site name is required'),
    tagline: text(200),
    heroEyebrow: text(160),
    heroHeadline: text(160).min(1, 'Hero headline is required'),
    heroHeadlineAccent: text(120),
    heroIntro: text(600),
    heroImageUrl: z
      .string()
      .trim()
      .max(500)
      .refine((v) => v === '' || /^\/(?!\/)\S*$/.test(v) || /^https:\/\/\S+$/i.test(v), 'Upload an image or use a full https:// link'),
    announcement: text(300),
    contact: z
      .object({
        email: z
          .string()
          .trim()
          .max(200)
          .refine((v) => v === '' || z.string().email().safeParse(v).success, 'Enter a valid email'),
        phone: text(40),
        address: text(400),
        mapUrl: externalUrl,
      })
      .partial(),
    social: z
      .object({
        linkedin: externalUrl,
        instagram: externalUrl,
        facebook: externalUrl,
        youtube: externalUrl,
        x: externalUrl,
      })
      .partial(),
  })
  .partial();

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: getSettings() });
  } catch (error) {
    return handleError(error, 'Settings GET');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = issuesToFieldErrors(parsed.error);
      return bad(Object.values(fieldErrors)[0] ?? 'Invalid settings', 422, fieldErrors);
    }
    const data = updateSettings(parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error, 'Settings PUT');
  }
}
