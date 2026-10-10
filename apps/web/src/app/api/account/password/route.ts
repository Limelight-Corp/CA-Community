import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { json, sameOrigin } from '../../../../lib/auth-server';
import { hashPassword, mutateAccounts, passwordProblem, verifyPassword, type MemberAccount } from '../../../../lib/member-accounts';
import { memberFromRequest, setSessionCookie } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ currentPassword: z.string().max(200), newPassword: z.string().max(200) });

/** Changes the password; signs out other sessions and keeps this one signed in. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  if (!rateLimit(`password:${account.id}`, 10, 15 * 60_000)) return json({ error: 'Too many attempts. Please wait a few minutes.' }, 429);
  const parsed = Input.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);
  if (!verifyPassword(parsed.data.currentPassword, account.passwordHash)) {
    return json({ error: 'Your current password is not correct.', fieldErrors: { currentPassword: 'Not correct' } }, 400);
  }
  const problem = passwordProblem(parsed.data.newPassword, account.email);
  if (problem) return json({ error: problem, fieldErrors: { newPassword: problem } }, 422);

  const passwordHash = hashPassword(parsed.data.newPassword);
  const updated = mutateAccounts<MemberAccount | null>((data) => {
    const a = data.accounts.find((x) => x.id === account.id);
    if (!a) return null;
    a.passwordHash = passwordHash;
    a.sessionVersion += 1;
    a.updatedAt = new Date().toISOString();
    return { ...a };
  });
  if (!updated) return json({ error: 'Account not found.' }, 404);
  const res = json({ ok: true });
  setSessionCookie(res, updated, req);
  return res;
}
