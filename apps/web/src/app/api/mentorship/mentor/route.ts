import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { readJsonBody } from '../../../../lib/form-guard';
import { fieldErrorsOf, json, sameOrigin } from '../../../../lib/auth-server';
import { isApprovedMember } from '../../../../lib/member-accounts';
import { memberFromRequest } from '../../../../lib/member-session';
import { saveMentorProfile, setMentorAvailability } from '../../../../lib/mentorship';
import { knownWingNumbers } from '../../../../lib/taxonomy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const MentorInput = z.object({
  headline: z.string().trim().min(5, 'Add a short headline (role, firm, experience)').max(160),
  expertise: z.array(z.string().trim().min(1).max(60)).min(1, 'Add at least one area of expertise').max(10),
  wings: z.array(z.number().int().min(1).max(99)).max(30),
  modes: z.array(z.enum(['Online', 'In person'])).min(1, 'Choose how you can mentor'),
  city: optional(80),
  capacity: z.number().int().min(1).max(5),
  bio: z.string().trim().min(30, 'Tell mentees a little more (at least 30 characters)').max(1200),
  linkedinUrl: optional(300).refine((v) => !v || /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\/.+/i.test(v), 'Enter a full LinkedIn URL'),
});

/** PUT — create / update the signed-in member's mentor profile (active members only). */
export async function PUT(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  if (!isApprovedMember(account)) return json({ error: 'Mentoring is open to active members.' }, 403);
  const parsed = MentorInput.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Please check the highlighted fields.', fieldErrors: fieldErrorsOf(parsed.error) }, 422);
  const input = { ...parsed.data, expertise: [...new Set(parsed.data.expertise)], wings: knownWingNumbers(parsed.data.wings) };
  const { profile, created } = saveMentorProfile(account, input);
  return json({ profile, created }, created ? 201 : 200);
}

/** PATCH { available } — pause / resume taking new mentees. */
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  const parsed = z.object({ available: z.boolean() }).safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);
  const profile = setMentorAvailability(account, parsed.data.available);
  if (!profile) return json({ error: 'Your mentor profile is not approved yet.' }, 409);
  return json({ profile });
}
