/**
 * Shared pieces of the member auth / account API routes (server only).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { passwordResetEmail, verifyEmailEmail } from '@ascend/shared';
import { issueToken, type MemberAccount } from './member-accounts';
import { emailBrand, queueMail } from './mailer';
import { siteUrl } from './seo';
import { SharedFailureThrottle } from '@ascend/db';

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Rejects cross-site POSTs. The session cookie is SameSite=Lax already; this also covers
 * requests from other origins that don't carry cookies (e.g. login CSRF).
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true; // same-origin fetches from older browsers may omit it
  try {
    return new URL(origin).host === (req.headers.get('x-forwarded-host') || req.headers.get('host'));
  } catch {
    return false;
  }
}

export const emailField = z.string().trim().toLowerCase().email('Enter a valid email address').max(160);
export const mobileField = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9\s-]{8,15}$/, 'Enter a valid mobile number');
export const nameField = z.string().trim().min(2, 'Please enter your full name').max(120);

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function sendVerificationEmail(account: Pick<MemberAccount, 'id' | 'name' | 'email'>): Promise<void> {
  const token = await issueToken(account.id, 'verify');
  if (!token) return;
  queueMail(account.email, verifyEmailEmail(await emailBrand(), { name: account.name, url: `${siteUrl()}/verify-email?token=${token}` }));
}

export async function sendPasswordResetEmail(account: Pick<MemberAccount, 'id' | 'name' | 'email'>): Promise<void> {
  const token = await issueToken(account.id, 'reset');
  if (!token) return;
  queueMail(account.email, passwordResetEmail(await emailBrand(), { name: account.name, url: `${siteUrl()}/reset-password?token=${token}` }));
}

/**
 * Per-email failed-login counter, shared by every server instance (PostgreSQL): 5 failures lock
 * the email for 15 minutes.
 */
const loginFailures = new SharedFailureThrottle('loginfail', 5, 15 * 60_000);

export async function loginLocked(email: string): Promise<boolean> {
  return (await loginFailures.lockedFor(email)) > 0;
}
export async function recordLoginFailure(email: string): Promise<void> {
  await loginFailures.fail(email);
}
export async function clearLoginFailures(email: string): Promise<void> {
  await loginFailures.clear(email);
}
