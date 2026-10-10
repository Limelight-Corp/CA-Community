import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit, readJsonBody } from '../../../../lib/form-guard';
import { emailField, fieldErrorsOf, json, mobileField, nameField, sameOrigin, sendVerificationEmail } from '../../../../lib/auth-server';
import { hashPassword, mutateAccounts, normaliseEmail, passwordProblem, publicAccount, type MemberAccount } from '../../../../lib/member-accounts';
import { setSessionCookie } from '../../../../lib/member-session';
import { newId } from '../../../../lib/community-store';
import { CAPTCHA_ERROR, tokenFrom, verifyTurnstile } from '../../../../lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Input = z.object({
  name: nameField,
  email: emailField,
  mobile: mobileField,
  password: z.string().max(200),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Please accept the terms and privacy policy' }) }),
  website: z.string().optional(),
});

/** Creates a member account, signs it in and emails a verification link. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  if (!rateLimit(`register:${clientIp(req)}`, 10, 60 * 60_000)) {
    return json({ error: 'Too many sign-ups from this network. Please try again later.' }, 429);
  }
  const body = await readJsonBody(req);
  if (!(await verifyTurnstile(tokenFrom(body), clientIp(req)))) return json({ error: CAPTCHA_ERROR }, 400);
  const parsed = Input.safeParse(body);
  if (!parsed.success) return json({ error: 'Please check the highlighted fields.', fieldErrors: fieldErrorsOf(parsed.error) }, 422);
  const input = parsed.data;
  if (input.website) return json({ ok: true }); // honeypot
  const problem = passwordProblem(input.password, input.email);
  if (problem) return json({ error: problem, fieldErrors: { password: problem } }, 422);

  const email = normaliseEmail(input.email);
  const passwordHash = hashPassword(input.password);
  const created = mutateAccounts<MemberAccount | null>((data) => {
    if (data.accounts.some((a) => a.email === email)) return null;
    const stamp = new Date().toISOString();
    const account: MemberAccount = {
      id: newId('acct'),
      name: input.name,
      email,
      mobile: input.mobile,
      passwordHash,
      sessionVersion: 1,
      profile: {},
      createdAt: stamp,
      updatedAt: stamp,
      lastLoginAt: stamp,
    };
    data.accounts.push(account);
    return account;
  });
  if (!created) {
    return json(
      {
        error: 'An account with this email already exists. Log in, or use "Forgot password" to reset it.',
        fieldErrors: { email: 'Already registered' },
      },
      409
    );
  }

  sendVerificationEmail(created);
  const res = json({ user: publicAccount(created) }, 201);
  setSessionCookie(res, created, req);
  return res;
}
