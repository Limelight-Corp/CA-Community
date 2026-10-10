'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccentText, Kicker, cn, useToast } from '@ascend/ui';
import { useAuth, type MemberUser } from '../../context/AuthContext';
import { safeNextPath } from '../../lib/auth-paths';
import { FxCard } from '../../components/home/Interactive';
import { Turnstile, useCaptchaEnabled } from '../../components/site/Turnstile';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  Phone,
  Receipt,
  ShieldCheck,
  Ticket,
  User,
  UserPlus,
} from 'lucide-react';

type Mode = 'login' | 'register';
type FieldErrors = Partial<Record<'name' | 'email' | 'mobile' | 'password' | 'acceptTerms', string>>;

export default function MemberLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, user, isLoading: authLoading } = useAuth();
  // Where to go after signing in, e.g. back to a paid event registration.
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('login');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setNextPath(safeNextPath(sp.get('next')));
    if (sp.get('mode') === 'register') setMode('register');
  }, []);

  // Already signed in (verified by the server): go straight on.
  useEffect(() => {
    if (!authLoading && user) router.replace(nextPath ?? '/dashboard');
  }, [authLoading, user, nextPath, router]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [captcha, setCaptcha] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const captchaOn = useCaptchaEnabled();

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrorMessage('');
    setFieldErrors({});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setFieldErrors({});
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }
    if (mode === 'register' && !acceptTerms) {
      setFieldErrors({ acceptTerms: 'Please accept the terms and privacy policy' });
      return;
    }
    if (mode === 'register' && captchaOn && !captcha) {
      setErrorMessage('Please complete the security check.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(
          mode === 'login' ? { email, password } : { name, email, mobile, password, acceptTerms, website: honeypot, turnstileToken: captcha }
        ),
      });
      if (mode === 'register') setCaptchaReset((n) => n + 1);
      const data = (await res.json().catch(() => ({}))) as { user?: Omit<MemberUser, 'initials'>; error?: string; fieldErrors?: FieldErrors };
      if (!res.ok || !data.user) {
        setErrorMessage(data.error || 'Something went wrong. Please try again.');
        setFieldErrors(data.fieldErrors ?? {});
        return;
      }
      login(data.user);
      toast(
        mode === 'register'
          ? `Account created! We sent a confirmation link to ${data.user.email}.`
          : nextPath
            ? 'Logged in — taking you back…'
            : `Welcome back, ${data.user.name.split(' ')[0]}!`
      );
      router.replace(nextPath ?? '/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass =
    'relative flex items-center rounded-2xl border border-mist/[0.12] bg-field/80 transition focus-within:border-brand-500 focus-within:shadow-[0_0_0_4px_rgb(var(--lime-rgb)/0.18)]';
  const inputClass = 'w-full bg-transparent py-4 pl-11 pr-4 text-[15px] text-white outline-none placeholder:text-faint';

  return (
    <section className="grain relative -mt-[72px] overflow-hidden pt-[72px]">
      <div className="aurora" aria-hidden>
        <i />
      </div>
      <div className="grid-lines absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-72px)] max-w-[1300px] items-center gap-10 px-5 py-10 md:px-8 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* ------------------------------------------------------------ Left: story + member pass */}
        <div className="flex min-w-0 flex-col gap-8">
          <div className="flex flex-col gap-5">
            <Kicker tone="gold">Member portal</Kicker>
            <h1 className="font-display text-[clamp(44px,7vw,96px)] font-medium leading-[0.9] tracking-[-0.055em] text-[var(--fg)]">
              {mode === 'login' ? (
                <>
                  Welcome <AccentText tone="hero">back.</AccentText>
                </>
              ) : (
                <>
                  Join the <AccentText tone="hero">climb.</AccentText>
                </>
              )}
            </h1>
            <p className="max-w-[44ch] text-[16px] leading-relaxed text-[var(--muted)]">
              Your event passes, receipts and certificates — in one place.{' '}
              {mode === 'login' ? 'Log in with your email and password.' : 'Create a free account in under a minute.'}
            </p>
          </div>

          <MemberPass identity={email.trim()} mode="email" />

          <ul className="hidden gap-2.5 sm:flex sm:flex-wrap">
            {[
              { icon: Ticket, label: 'Event passes' },
              { icon: Receipt, label: 'Payment receipts' },
              { icon: Layers, label: 'Your wings' },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-mist/[0.12] bg-bg/40 px-3.5 py-2 text-[13px] text-[var(--fg)] backdrop-blur"
              >
                <Icon className="h-4 w-4 text-gold" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* ------------------------------------------------------------ Right: login / register card */}
        <div className="relative min-w-0">
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[48px] bg-brand-500/20 blur-[80px]" />
          <div className="shine glass-panel relative overflow-hidden rounded-[32px] p-6 shadow-[0_40px_90px_-40px_rgb(var(--black-rgb)/0.9)] sm:p-9">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-[80px]" />

            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">{mode === 'login' ? 'Sign in' : 'New account'}</p>
                <h2 className="mt-1 font-display text-[28px] font-medium tracking-[-0.035em] text-[var(--fg)]">
                  {mode === 'login' ? 'Log in to your account' : 'Create your account'}
                </h2>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-grad-primary text-white shadow-[0_12px_30px_-12px_rgb(var(--lime-rgb)/0.9)]">
                {mode === 'login' ? <Lock className="h-5 w-5" aria-hidden /> : <UserPlus className="h-5 w-5" aria-hidden />}
              </span>
            </div>

            {/* Mode switch with sliding pill */}
            <div className="relative mt-6 grid grid-cols-2 rounded-full border border-mist/[0.12] bg-bg/60 p-1" role="tablist" aria-label="Account">
              <span
                aria-hidden
                className={cn(
                  'absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-grad-primary shadow-[0_8px_22px_-8px_rgb(var(--lime-rgb)/0.9)] transition-transform duration-500 [transition-timing-function:var(--ease-out-expo)]',
                  mode === 'register' && 'translate-x-full'
                )}
              />
              {(
                [
                  { key: 'login', label: 'Log in', Icon: Lock },
                  { key: 'register', label: 'Create account', Icon: UserPlus },
                ] as const
              ).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => switchMode(key)}
                  className={cn(
                    'relative z-10 flex items-center justify-center gap-2 rounded-full py-2.5 text-[13.5px] font-semibold transition-colors',
                    mode === key ? 'text-white' : 'text-[var(--muted)] hover:text-[var(--fg)]'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            {nextPath && (
              <div role="status" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-gold/30 bg-gold/10 p-3.5 text-[13px] text-gold">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {nextPath.startsWith('/events/') || nextPath.startsWith('/registration/')
                    ? 'Please log in (or create a free account) to continue to payment. You will come straight back to your registration.'
                    : 'Please log in to continue. You will come straight back afterwards.'}
                </span>
              </div>
            )}

            {errorMessage && (
              <div role="alert" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-bad/30 bg-bad/10 p-3.5 text-[13px] text-bad">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={submit} className="mt-6 flex flex-col gap-5" noValidate>
              {mode === 'register' && (
                <>
                  <Field id="reg-name" label="Full name" error={fieldErrors.name}>
                    <div className={fieldClass}>
                      <User className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--muted)]" aria-hidden />
                      <input id="reg-name" autoComplete="name" placeholder="CA Your Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                  </Field>
                  <Field id="reg-mobile" label="Mobile number" error={fieldErrors.mobile}>
                    <div className={fieldClass}>
                      <Phone className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--muted)]" aria-hidden />
                      <input
                        id="reg-mobile"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="98765 43210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </Field>
                </>
              )}

              <Field id="login-email" label="Email address" error={fieldErrors.email}>
                <div className={fieldClass}>
                  <Mail className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--muted)]" aria-hidden />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="ca.name@firm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </Field>

              <Field
                id="login-password"
                label="Password"
                error={fieldErrors.password}
                hint={mode === 'register' ? 'At least 8 characters, with letters and a number.' : undefined}
                aside={
                  mode === 'login' ? (
                    <Link href="/forgot-password" className="text-[12px] text-brand-200 hover:text-white hover:underline">
                      Forgot password?
                    </Link>
                  ) : undefined
                }
              >
                <div className={fieldClass}>
                  <Lock className="pointer-events-none absolute left-4 h-4 w-4 text-[var(--muted)]" aria-hidden />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={mode === 'login' ? 'Your password' : 'Choose a password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent py-4 pl-11 pr-12 text-[15px] text-white outline-none placeholder:text-faint"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-mist/[0.06] hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {mode === 'register' && (
                <>
                  {/* Honeypot: hidden from people, filled by bots. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    className="absolute -left-[9999px] h-px w-px opacity-0"
                    aria-hidden
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-[var(--muted)]">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--lime)]"
                      />
                      <span>
                        I agree to the{' '}
                        <Link href="/legal/terms" className="text-[var(--fg)] underline underline-offset-2">
                          Terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/legal/privacy" className="text-[var(--fg)] underline underline-offset-2">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                    {fieldErrors.acceptTerms && <span className="text-[12px] text-bad">{fieldErrors.acceptTerms}</span>}
                  </div>
                </>
              )}

              {mode === 'register' && <Turnstile onToken={setCaptcha} resetKey={captchaReset} />}

              <SubmitButton loading={isLoading} loadingLabel={mode === 'login' ? 'Signing in…' : 'Creating account…'}>
                {mode === 'login' ? 'Log in' : 'Create account'}
              </SubmitButton>
            </form>

            <div className="relative mt-8 flex flex-col gap-4 border-t border-mist/[0.1] pt-6">
              <p className="text-center text-[14px] text-[var(--muted)]">
                {mode === 'login' ? (
                  <>
                    New here?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="font-semibold text-white underline underline-offset-4 hover:text-gold">
                      Create a free account →
                    </button>
                  </>
                ) : (
                  <>
                    Want full membership?{' '}
                    <Link href="/join" className="font-semibold text-white underline underline-offset-4 hover:text-gold">
                      See plans →
                    </Link>
                  </>
                )}
              </p>
              <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-[var(--muted)]">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />
                We never ask for your password by phone or message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  aside,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-[var(--fg)]">
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error ? <span className="text-[12px] text-bad">{error}</span> : hint ? <span className="text-[12px] text-[var(--muted)]">{hint}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Member pass — 3D holographic card that previews the identity being typed                  */
/* ------------------------------------------------------------------------------------------ */

function MemberPass({ identity, mode }: { identity: string; mode: 'otp' | 'email' }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[460px] lg:mx-0"
      style={{ perspective: '1200px' }}
    >
      <div
        aria-hidden
        className="absolute inset-x-10 -bottom-6 h-10 rounded-full bg-brand-500/40 blur-2xl"
      />
      <FxCard max={14} className="float holo rounded-[28px]">
        <div className="relative aspect-[1.6/1] overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-br from-brand-500 via-brand-800 to-brand-950 p-5 sm:p-7">
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold/35 blur-[60px]"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-brand-300/40 blur-[70px]"
          />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 backdrop-blur">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 19 L10 6 L14 13 L17 9 L21 19" />
                  </svg>
                </span>
                <span className="font-display text-[14px] font-semibold tracking-[0.16em] text-white">
                  ASCEND
                </span>
              </span>
              <span className="rounded-full border border-gold/50 bg-gold/15 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-gold-soft">
                Member pass
              </span>
            </div>

            {/* chip */}
            <span
              aria-hidden
              className="h-8 w-11 rounded-md bg-grad-gold opacity-90 shadow-inner sm:h-9 sm:w-12"
            />

            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/60">
                  {mode === 'otp' ? 'Mobile' : 'Email'}
                </p>
                <p className="mt-1 truncate font-mono text-[clamp(14px,2.2vw,19px)] tracking-wide text-white">
                  {identity || (mode === 'otp' ? '+91 •• ••• •••' : 'you@firm.com')}
                </p>
                <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-gold-soft">
                  Founding member · 2027
                </p>
              </div>
              {/* decorative code pattern */}
              <span
                aria-hidden
                className="grid shrink-0 grid-cols-5 gap-[3px] rounded-lg bg-white/90 p-1.5"
              >
                {Array.from({ length: 25 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-[1px] sm:h-2.5 sm:w-2.5',
                      [0, 1, 2, 4, 5, 9, 12, 14, 15, 19, 20, 21, 22, 24, 7, 17].includes(i)
                        ? 'bg-brand-950'
                        : 'bg-transparent'
                    )}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>
      </FxCard>
    </div>
  );
}

function SubmitButton({
  loading,
  loadingLabel,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-shimmer group mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {loadingLabel}
        </>
      ) : (
        <>
          {children}
          <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-1">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        </>
      )}
    </button>
  );
}
