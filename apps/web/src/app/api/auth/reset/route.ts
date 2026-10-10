import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { clearLoginFailures, json, sameOrigin } from '../../../../lib/auth-server';
import { accountForToken, hashPassword, mutateAccounts, passwordProblem } from '../../../../lib/member-accounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ token: z.string().max(100), password: z.string().max(200) });

/** Sets a new password from a reset link and signs out every existing session. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  if (!rateLimit(`reset:${clientIp(req)}`, 20, 60 * 60_000)) {
    return json({ error: 'Too many attempts. Please try again later.' }, 429);
  }
  const parsed = Input.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);
  const account = accountForToken(parsed.data.token, 'reset');
  if (!account) return json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, 400);
  const problem = passwordProblem(parsed.data.password, account.email);
  if (problem) return json({ error: problem, fieldErrors: { password: problem } }, 422);

  const passwordHash = hashPassword(parsed.data.password);
  mutateAccounts((data) => {
    const a = data.accounts.find((x) => x.id === account.id);
    if (!a) return;
    a.passwordHash = passwordHash;
    a.sessionVersion += 1;
    a.resetTokenHash = undefined;
    a.resetTokenExp = undefined;
    // Opening the emailed link proves the address belongs to them.
    a.emailVerifiedAt = a.emailVerifiedAt ?? new Date().toISOString();
    a.updatedAt = new Date().toISOString();
  });
  clearLoginFailures(account.email);
  return json({ ok: true });
}
