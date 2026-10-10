import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { readJsonBody } from '../../../../lib/form-guard';
import { fieldErrorsOf, json, mobileField, nameField, sameOrigin } from '../../../../lib/auth-server';
import { mutateAccounts, publicAccount, type MemberAccount } from '../../../../lib/member-accounts';
import { memberFromRequest } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));

const Input = z.object({
  name: nameField,
  mobile: mobileField,
  city: text(80),
  membershipNo: text(40),
  qualificationYear: text(4).refine(
    (v) => !v || (/^\d{4}$/.test(v) && Number(v) >= 1950 && Number(v) <= new Date().getFullYear() + 1),
    'Enter a 4-digit year'
  ),
  areaOfPractice: text(120),
  organisation: text(160),
  designation: text(120),
  linkedinUrl: text(300).refine((v) => !v || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(v), 'Enter a full LinkedIn URL (https://linkedin.com/in/…)'),
  bio: text(600),
});

/** Updates the signed-in member's profile. Email changes are not supported here. */
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  const parsed = Input.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Please check the highlighted fields.', fieldErrors: fieldErrorsOf(parsed.error) }, 422);
  const { name, mobile, ...profile } = parsed.data;

  const updated = mutateAccounts<MemberAccount | null>((data) => {
    const a = data.accounts.find((x) => x.id === account.id);
    if (!a) return null;
    a.name = name;
    a.mobile = mobile;
    a.profile = { ...a.profile, ...profile };
    a.updatedAt = new Date().toISOString();
    return { ...a };
  });
  if (!updated) return json({ error: 'Account not found.' }, 404);
  return json({ user: publicAccount(updated), profile: updated.profile });
}
