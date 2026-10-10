'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, MailCheck } from 'lucide-react';
import { AuthPanel, authButtonClass, authInputClass } from '../../components/auth/AuthPanel';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error || 'Something went wrong. Please try again.');
      else setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthPanel kicker="Check your inbox" title="Reset link on its way.">
        <p className="flex items-start gap-3">
          <MailCheck className="mt-1 h-5 w-5 shrink-0 text-ok" aria-hidden />
          <span>
            If an account exists for <strong className="text-[var(--fg)]">{email}</strong>, we’ve emailed a link to choose a new password. It is
            valid for 1 hour. Don’t forget to check your spam folder.
          </span>
        </p>
        <Link href="/login" className="text-center text-[14px] font-semibold text-white underline underline-offset-4 hover:text-gold">
          Back to log in
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel kicker="Forgot password" title="Let’s get you back in.">
      <p>Enter the email you registered with and we’ll send you a link to choose a new password.</p>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <label htmlFor="forgot-email" className="text-[13px] font-medium text-[var(--fg)]">
          Email address
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          placeholder="ca.name@firm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
        />
        {error && (
          <span role="alert" className="text-[13px] text-bad">
            {error}
          </span>
        )}
        <button type="submit" disabled={busy || !email.trim()} className={authButtonClass}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {busy ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <Link href="/login" className="text-center text-[14px] text-[var(--muted)] underline underline-offset-4 hover:text-white">
        Remembered it? Log in
      </Link>
    </AuthPanel>
  );
}
