import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AuthPanel, authButtonClass } from '../../components/auth/AuthPanel';
import { accountForToken, mutateAccounts } from '../../lib/member-accounts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Confirm your email', robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = '' } = await searchParams;
  const account = accountForToken(token, 'verify');
  if (account) {
    mutateAccounts((data) => {
      const a = data.accounts.find((x) => x.id === account.id);
      if (!a) return;
      a.emailVerifiedAt = a.emailVerifiedAt ?? new Date().toISOString();
      a.verifyTokenHash = undefined;
      a.verifyTokenExp = undefined;
      a.updatedAt = new Date().toISOString();
    });
  }

  return account ? (
    <AuthPanel kicker="Email confirmed" title="You’re all set.">
      <p className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-ok" aria-hidden />
        <span>
          <strong className="text-[var(--fg)]">{account.email}</strong> is confirmed. Your event bookings, receipts and certificates made with this
          email now show up in your dashboard.
        </span>
      </p>
      <Link href="/dashboard" className={authButtonClass}>
        Go to my dashboard
      </Link>
    </AuthPanel>
  ) : (
    <AuthPanel kicker="Link expired" title="This link doesn’t work any more.">
      <p className="flex items-start gap-3">
        <XCircle className="mt-1 h-5 w-5 shrink-0 text-bad" aria-hidden />
        <span>The confirmation link is invalid, already used or older than 48 hours. Log in and use “Resend link” on your dashboard to get a new one.</span>
      </p>
      <Link href="/login?next=/dashboard" className={authButtonClass}>
        Log in
      </Link>
    </AuthPanel>
  );
}
