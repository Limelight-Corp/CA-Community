'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WebShell } from '../../components/WebShell';
import {
  Heading,
  Eyebrow,
  Input,
  Button,
  SegmentedControl,
  useToast,
} from '@ascend/ui';

export default function MemberLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loginMode, setLoginMode] = useState<'otp' | 'email'>('otp');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile.replace(/\s+/g, ''))) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      // In production calls API /api/v1/auth/send-otp
      setOtpSent(true);
      toast(`OTP sent to ${mobile}. (Dev code: 123456)`);
    } catch (_err) {
      setErrorMessage('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setErrorMessage('Please enter the 6-digit OTP');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      toast('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch (_err) {
      setErrorMessage('Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please provide both email and password');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      toast('Login successful! Welcome back.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch (_err) {
      setErrorMessage('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WebShell>
      <section className="py-16 md:py-24 px-5">
        <div className="max-w-[460px] mx-auto flex flex-col gap-8">
          <div>
            <Eyebrow>Members</Eyebrow>
            <Heading level="h1" className="text-[clamp(38px,5cqi,56px)] mt-4">
              Welcome{' '}
              <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-[#9DB6FF] to-[#DBE7F0]">
                back.
              </em>
            </Heading>
          </div>

          {/* Mode Switcher */}
          <SegmentedControl
            options={[
              { id: 'otp', label: 'Mobile OTP' },
              { id: 'email', label: 'Email' },
            ]}
            value={loginMode}
            onChange={(val) => {
              setLoginMode(val);
              setErrorMessage('');
            }}
            fullWidth
          />

          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-[var(--bad-bg)] border border-[rgba(255,154,163,0.2)] text-[var(--bad)] text-[14px]">
              {errorMessage}
            </div>
          )}

          {/* Mobile OTP Form */}
          {loginMode === 'otp' && (
            <form
              onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
              className="flex flex-col gap-4.5"
            >
              <Input
                label="Mobile number"
                placeholder="98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={otpSent}
                inputMode="tel"
                mono
              />

              {otpSent && (
                <Input
                  label="6-Digit OTP"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  mono
                  autoFocus
                />
              )}

              <Button variant="dark" fullWidth type="submit" isLoading={isLoading}>
                {otpSent ? 'Verify & Log In' : 'Send OTP'}
              </Button>

              {otpSent && (
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-center font-mono text-[12px] text-[var(--muted)] hover:text-white underline cursor-pointer bg-transparent border-0"
                >
                  Change mobile number
                </button>
              )}
            </form>
          )}

          {/* Email Login Form */}
          {loginMode === 'email' && (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4.5">
              <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button variant="dark" fullWidth type="submit" isLoading={isLoading}>
                Log in
              </Button>
            </form>
          )}

          <p className="text-[14px] text-[var(--muted)] text-center">
            New here?{' '}
            <Link
              href="/join"
              className="text-[var(--fg)] underline hover:text-white transition-colors"
            >
              Become a member
            </Link>
          </p>
        </div>
      </section>
    </WebShell>
  );
}
