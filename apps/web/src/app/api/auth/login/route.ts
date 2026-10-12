import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { clearLoginFailures, json, loginLocked, recordLoginFailure, sameOrigin } from '../../../../lib/auth-server';
import { findAccountByEmail, normaliseEmail, publicAccount, recordLogin, verifyPassword } from '../../../../lib/member-accounts';
import { setSessionCookie } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({ email: z.string().trim().max(160), password: z.string().max(200) });
const INVALID = 'Incorrect email or password.';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  if (!(await rateLimit(`login:${clientIp(req)}`, 30, 15 * 60_000))) {
    return json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, 429);
  }
  const parsed = Input.safeParse(await readJsonBody(req));
  if (!parsed.success || !parsed.data.email || !parsed.data.password) {
    return json({ error: 'Enter your email and password.' }, 400);
  }
  const email = normaliseEmail(parsed.data.email);
  if (await loginLocked(email)) {
    return json({ error: 'Too many failed attempts for this account. Try again in 15 minutes or reset your password.' }, 429);
  }

  const account = await findAccountByEmail(email);
  // verifyPassword runs even for unknown emails so timing doesn't reveal which accounts exist.
  if (!(await verifyPassword(parsed.data.password, account?.passwordHash)) || !account) {
    await recordLoginFailure(email);
    return json({ error: INVALID }, 401);
  }
  await clearLoginFailures(email);
  await recordLogin(account.id);
  const res = json({ user: await publicAccount(account) });
  setSessionCookie(res, account, req);
  return res;
}
