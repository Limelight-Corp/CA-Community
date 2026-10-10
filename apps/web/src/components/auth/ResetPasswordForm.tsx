'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { authButtonClass, authInputClass } from './AuthPanel';

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error || 'Something went wrong. Please try again.');
      else setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <>
        <p className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-ok" aria-hidden />
          <span>Your password has been changed. Log in with your new password.</span>
        </p>
        <Link href="/login" className={authButtonClass}>
          Log in
        </Link>
      </>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <label htmlFor="new-password" className="text-[13px] font-medium text-[var(--fg)]">
        New password
      </label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={authInputClass}
      />
      <span className="-mt-2 text-[12px]">At least 8 characters, with letters and a number.</span>
      <label htmlFor="confirm-password" className="text-[13px] font-medium text-[var(--fg)]">
        Confirm new password
      </label>
      <input
        id="confirm-password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className={authInputClass}
      />
      {error && (
        <span role="alert" className="text-[13px] text-bad">
          {error}
        </span>
      )}
      <button type="submit" disabled={busy || !password} className={authButtonClass}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? 'Saving…' : 'Save new password'}
      </button>
    </form>
  );
}
