/**
 * Shared pieces of the member auth / account API routes (server only).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { passwordResetEmail, verifyEmailEmail } from '@ascend/shared';
import { issueToken, type MemberAccount } from './member-accounts';
import { emailBrand, queueMail } from './mailer';
import { siteUrl } from './seo';

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

export function sendVerificationEmail(account: Pick<MemberAccount, 'id' | 'name' | 'email'>): void {
  const token = issueToken(account.id, 'verify');
  if (!token) return;
  queueMail(account.email, verifyEmailEmail(emailBrand(), { name: account.name, url: `${siteUrl()}/verify-email?token=${token}` }));
}

export function sendPasswordResetEmail(account: Pick<MemberAccount, 'id' | 'name' | 'email'>): void {
  const token = issueToken(account.id, 'reset');
  if (!token) return;
  queueMail(account.email, passwordResetEmail(emailBrand(), { name: account.name, url: `${siteUrl()}/reset-password?token=${token}` }));
}

/** Per-email failed-login counter (in memory): 5 failures lock the email for 15 minutes. */
const failures = new Map<string, { count: number; until: number }>();
const LOCK_AFTER = 5;
const LOCK_MS = 15 * 60_000;

export function loginLocked(email: string): boolean {
  const f = failures.get(email);
  return !!f && f.count >= LOCK_AFTER && f.until > Date.now();
}
export function recordLoginFailure(email: string): void {
  const now = Date.now();
  const f = failures.get(email);
  if (!f || f.until <= now) failures.set(email, { count: 1, until: now + LOCK_MS });
  else f.count += 1;
}
export function clearLoginFailures(email: string): void {
  failures.delete(email);
}
