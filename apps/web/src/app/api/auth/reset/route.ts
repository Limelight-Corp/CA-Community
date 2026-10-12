import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { clearLoginFailures, json, sameOrigin } from '../../../../lib/auth-server';
import { accountForToken, consumeToken, hashPassword, passwordProblem, setPassword } from '../../../../lib/member-accounts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ token: z.string().max(100), password: z.string().max(200) });

/** Sets a new password from a reset link and signs out every existing session. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  if (!(await rateLimit(`reset:${clientIp(req)}`, 20, 60 * 60_000))) {
    return json({ error: 'Too many attempts. Please try again later.' }, 429);
  }
  const parsed = Input.safeParse(await readJsonBody(req));
  if (!parsed.success) return json({ error: 'Invalid request.' }, 400);
  const account = await accountForToken(parsed.data.token, 'reset');
  if (!account) return json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, 400);
  const problem = passwordProblem(parsed.data.password, account.email);
  if (problem) return json({ error: problem, fieldErrors: { password: problem } }, 422);

  const passwordHash = await hashPassword(parsed.data.password);
  // Single use: a second submit with the same link fails here.
  if (!(await consumeToken(parsed.data.token, 'reset'))) {
    return json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, 400);
  }
  // Opening the emailed link proves the address belongs to them.
  await setPassword(account.id, passwordHash, { verifyEmail: true });
  await clearLoginFailures(account.email);
  return json({ ok: true });
}
