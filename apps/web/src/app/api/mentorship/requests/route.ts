import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { MENTORSHIP_STAGES } from '@ascend/shared';
import { rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { fieldErrorsOf, json, sameOrigin } from '../../../../lib/auth-server';
import { isApprovedMember } from '../../../../lib/member-accounts';
import { memberFromRequest } from '../../../../lib/member-session';
import { createRequest, withdrawRequest } from '../../../../lib/mentorship';
import { knownWingNumbers } from '../../../../lib/taxonomy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RequestInput = z.object({
  stage: z.enum(MENTORSHIP_STAGES as unknown as [string, ...string[]]),
  goals: z.string().trim().min(30, 'Describe what you would like help with (at least 30 characters)').max(1500),
  wings: z.array(z.number().int().min(1).max(99)).max(30),
  preferredMentorId: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/** POST — ask for a mentor (active members only; one open request at a time). */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  if (!isApprovedMember(account)) return json({ error: 'Mentorship is a member benefit — it opens once your membership is active.' }, 403);
  if (!rateLimit(`mreq:${account.id}`, 5, 60 * 60_000)) return json({ error: 'Too many requests. Please try again later.' }, 429);
  const parsed = RequestInput.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Please check the highlighted fields.', fieldErrors: fieldErrorsOf(parsed.error) }, 422);
  const result = createRequest(account, { ...parsed.data, stage: parsed.data.stage as (typeof MENTORSHIP_STAGES)[number], wings: knownWingNumbers(parsed.data.wings) });
  if (!result.ok) return json({ error: result.error }, 409);
  return json({ request: result.request }, 201);
}

/** DELETE ?id= — withdraw your own open request. */
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  const id = req.nextUrl.searchParams.get('id') || '';
  if (!withdrawRequest(account, id)) return json({ error: 'Request not found or already handled.' }, 404);
  return json({ ok: true });
}
