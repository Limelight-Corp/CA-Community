import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPanel, authButtonClass } from '../../components/auth/AuthPanel';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';
import { accountForToken } from '../../lib/member-accounts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  const account = accountForToken(token, 'reset');
  if (!account) {
    return (
      <AuthPanel kicker="Link expired" title="This reset link doesn’t work any more.">
        <p>Reset links are valid for 1 hour and can be used once. Request a new one and use the latest email.</p>
        <Link href="/forgot-password" className={authButtonClass}>
          Send a new link
        </Link>
      </AuthPanel>
    );
  }
  return (
    <AuthPanel kicker="New password" title="Choose a new password.">
      <p>
        For <strong className="text-[var(--fg)]">{account.email}</strong>. You’ll be signed out on every other device.
      </p>
      <ResetPasswordForm token={token} />
    </AuthPanel>
  );
}
