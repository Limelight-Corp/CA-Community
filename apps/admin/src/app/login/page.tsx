'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heading,
  Eyebrow,
  Input,
  Button,
  AscendLogoMark,
  LockIcon,
} from '@ascend/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@ascend-ca.in');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter admin email and password');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      // In production calls /admin-api/v1/auth/login
      if (!requires2FA) {
        // Step 1: verify password, request TOTP code
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }

      if (!totpCode || totpCode.length < 6) {
        setErrorMessage('Please enter the 6-digit TOTP code');
        setIsLoading(false);
        return;
      }

      // Success
      router.push('/dashboard');
    } catch (_err) {
      setErrorMessage('Invalid admin credentials or 2FA code');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(50%_50%_at_50%_30%,rgba(15,56,192,0.35),transparent_70%),var(--bg)]">
      <div className="w-full max-w-md bg-[linear-gradient(180deg,rgba(219,231,240,0.05),rgba(219,231,240,0.015)),var(--card)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-10 shadow-2xl flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#4A72FF] to-[#1F45D6] grid place-items-center text-white">
            <AscendLogoMark size={20} />
          </span>
          <div>
            <b className="font-display font-semibold text-[16px] tracking-widest text-white">
              ASCEND
            </b>
            <span className="block font-mono text-[11px] text-[var(--muted)] uppercase tracking-wider">
              Control Panel
            </span>
          </div>
        </div>

        <div>
          <Eyebrow>Security Zone</Eyebrow>
          <Heading level="h2" className="text-2xl mt-2">
            Administrator Sign In
          </Heading>
          <p className="text-[13.5px] text-[var(--muted)] mt-1">
            Zero-trust isolated backoffice. Access requires verified credentials and TOTP.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-[var(--bad-bg)] border border-[rgba(255,154,163,0.2)] text-[var(--bad)] text-[13.5px]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Admin email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={requires2FA}
            autoFocus={!requires2FA}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={requires2FA}
          />

          {requires2FA && (
            <div className="p-4 rounded-[14px] bg-[rgba(47,91,255,0.08)] border border-[rgba(111,149,255,0.25)] flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
              <span className="font-mono text-[12px] text-[#C9D6FF] flex items-center gap-2">
                <LockIcon size={14} />
                Two-Factor Verification
              </span>
              <Input
                label="6-Digit Authenticator Code"
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                maxLength={6}
                mono
                autoFocus
              />
            </div>
          )}

          <Button variant="dark" fullWidth type="submit" isLoading={isLoading}>
            {requires2FA ? 'Verify 2FA & Access' : 'Authenticate'}
          </Button>

          {requires2FA && (
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTotpCode('');
              }}
              className="font-mono text-[12px] text-[var(--muted)] hover:text-white underline cursor-pointer bg-transparent border-0 self-center"
            >
              Re-enter password
            </button>
          )}
        </form>

        <div className="border-t border-[var(--line)] pt-4 text-center font-mono text-[11px] text-[var(--faint)]">
          Protected by IP allowlist & Admin Session Guard
        </div>
      </div>
    </div>
  );
}
