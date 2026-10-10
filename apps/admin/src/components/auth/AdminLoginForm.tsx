'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Inbox,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  ShieldCheck,
  Ticket,
  TriangleAlert,
  User,
  UserCheck,
} from 'lucide-react';
import { cn } from '@ascend/ui';

type Status =
  { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'success' };

/** Sections that exist in the console — shown as the "what's inside" orbit on the left. */
const MODULES = [
  { label: 'Events', icon: CalendarDays },
  { label: 'Registrations', icon: Ticket },
  { label: 'Members', icon: UserCheck },
  { label: 'Messages', icon: Inbox },
  { label: 'Content', icon: Layers },
  { label: 'Analytics', icon: Activity },
];

function ConsoleRadar() {
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-[420px]">
      {/* rings */}
      {[100, 76, 52, 28].map((s) => (
        <span
          key={s}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-mist/[0.09]"
          style={{ width: `${s}%`, height: `${s}%` }}
        />
      ))}
      {/* crosshair */}
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-mist/[0.1] to-transparent" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-mist/[0.1] to-transparent" />
      {/* sweep */}
      <span className="radar-sweep absolute inset-0 rounded-full" />
      {/* modules on the outer orbit */}
      <div className="radar-orbit absolute inset-0">
        {MODULES.map((m, i) => {
          const angle = (i / MODULES.length) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(angle) * 38;
          const y = 50 + Math.sin(angle) * 38;
          const Icon = m.icon;
          return (
            <span
              key={m.label}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="radar-counter glass-panel flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-[var(--fg)] shadow-[0_10px_30px_-12px_rgb(var(--black-rgb)/0.9)]">
                <Icon className="h-3.5 w-3.5 text-gold" />
                {m.label}
              </span>
            </span>
          );
        })}
      </div>
      {/* core */}
      <span className="absolute left-1/2 top-1/2 grid h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 place-items-center">
        <span className="ring-spin grid h-full w-full place-items-center rounded-full">
          <span className="grid h-full w-full place-items-center rounded-full bg-panel">
            <span className="font-display text-[clamp(22px,3vw,34px)] font-semibold bg-grad-gold bg-clip-text text-transparent">
              A
            </span>
          </span>
        </span>
      </span>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]"
      >
        {label}
      </label>
      <div
        className={cn(
          'group relative flex h-[52px] items-center gap-3 rounded-2xl border bg-bg/60 px-4 transition focus-within:bg-bg/80',
          error
            ? 'border-bad/50 focus-within:border-bad'
            : 'border-mist/[0.12] focus-within:border-gold/60 focus-within:shadow-[0_0_0_4px_rgb(var(--gold-rgb)/0.12)]'
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition',
            error ? 'text-bad' : 'text-faint group-focus-within:text-gold'
          )}
        />
        {children}
      </div>
      {error ? (
        <span id={`${id}-error`} className="text-[12px] text-bad">
          {error}
        </span>
      ) : (
        hint
      )}
    </div>
  );
}

export function AdminLoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // After a failed attempt (inputs are re-enabled), put the cursor back where it's needed.
  useEffect(() => {
    if (status.kind === 'error') (fieldErrors.username ? userRef : passRef).current?.focus();
  }, [status, fieldErrors]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.kind === 'loading' || status.kind === 'success') return;
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = 'Username is required';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setShake(true);
      return;
    }

    setStatus({ kind: 'loading' });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password, next }),
      });
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
        data?: { next?: string };
      } | null;
      if (!res.ok || !json?.success) {
        setFieldErrors(json?.fieldErrors ?? {});
        setStatus({ kind: 'error', message: json?.error || `Sign-in failed (${res.status}).` });
        setPassword('');
        setShake(true);
        return;
      }
      setStatus({ kind: 'success' });
      // Full navigation so the middleware sees the new session cookie.
      window.setTimeout(() => window.location.assign(json.data?.next || '/dashboard'), 650);
    } catch {
      setStatus({ kind: 'error', message: 'Network error — check your connection and try again.' });
      setShake(true);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  const busy = !configured || status.kind === 'loading' || status.kind === 'success';

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-bg">
      <div className="aurora opacity-60">
        <i />
      </div>
      <div aria-hidden className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-[1240px] items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-10">
        {/* Left: console visual */}
        <section className="hidden min-w-0 flex-col gap-8 lg:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-grad-primary font-display text-[19px] font-semibold text-white shadow-[0_10px_30px_-10px_rgb(var(--lime-rgb)/0.9)]">
              A
            </span>
            <span className="leading-tight">
              <b className="block font-display text-[17px] font-semibold tracking-[0.14em] text-[var(--fg)]">
                ASCEND
              </b>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">
                Admin console
              </span>
            </span>
          </div>
          <div>
            <h1 className="font-display text-[clamp(38px,4.4vw,60px)] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--fg)]">
              Mission control
              <br />
              <span className="bg-gradient-to-r from-gold-soft via-gold to-brand-200 bg-clip-text text-transparent">
                for the community.
              </span>
            </h1>
            <p className="mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-[var(--muted)]">
              Events, registrations, members, messages and every page of the website — managed from
              one place.
            </p>
          </div>
          <ConsoleRadar />
        </section>

        {/* Right: sign-in card */}
        <section className="flex min-w-0 flex-col items-center">
          {/* Compact brand on mobile */}
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-grad-primary font-display text-[19px] font-semibold text-white">
              A
            </span>
            <span className="leading-tight">
              <b className="block font-display text-[17px] font-semibold tracking-[0.14em] text-[var(--fg)]">
                ASCEND
              </b>
              <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">
                Admin console
              </span>
            </span>
          </div>

          <div
            className={cn('w-full max-w-[440px]', shake && 'login-shake')}
            onAnimationEnd={(e) => e.target === e.currentTarget && setShake(false)}
          >
            <div className="shine glass-panel relative overflow-hidden rounded-[28px] p-6 shadow-[0_40px_90px_-40px_rgb(var(--black-rgb)/0.95)] sm:p-8">
              <span
                aria-hidden
                className="login-scan pointer-events-none absolute inset-x-0 top-0 h-24"
              />

              <div className="relative flex items-center justify-between">
                <span
                  className={cn(
                    'grid h-14 w-14 place-items-center rounded-2xl border transition-all duration-500',
                    status.kind === 'success'
                      ? 'border-ok/40 bg-ok/15 text-ok'
                      : status.kind === 'error'
                        ? 'border-bad/40 bg-bad/10 text-bad'
                        : 'border-gold/30 bg-gold/10 text-gold'
                  )}
                >
                  {status.kind === 'success' ? (
                    <ShieldCheck className="h-7 w-7" />
                  ) : (
                    <Lock className="h-6 w-6" />
                  )}
                </span>
                <span className="flex items-center gap-2 rounded-full border border-mist/[0.1] bg-bg/50 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span className="live-dot" />
                  Secure area
                </span>
              </div>

              <h2 className="relative mt-6 font-display text-[28px] font-semibold tracking-[-0.02em] text-[var(--fg)] sm:text-[32px]">
                {status.kind === 'success' ? 'Access granted' : 'Welcome back'}
              </h2>
              <p className="relative mt-1.5 text-[14.5px] text-[var(--muted)]">
                {status.kind === 'success'
                  ? 'Opening the console…'
                  : 'Sign in to manage the ASCEND website.'}
              </p>

              {!configured && (
                <p
                  role="status"
                  className="relative mt-6 flex items-start gap-2 rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-[13.5px] leading-relaxed text-warn"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Admin sign-in is not set up on this server yet. Set <code className="font-mono">ADMIN_GATE_USER</code>{' '}
                    and <code className="font-mono">ADMIN_GATE_PASSWORD</code> and restart the admin.
                  </span>
                </p>
              )}

              <form onSubmit={onSubmit} noValidate className="relative mt-7 flex flex-col gap-5">
                <Field id="username" label="Username" icon={User} error={fieldErrors.username}>
                  <input
                    ref={userRef}
                    id="username"
                    name="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={username}
                    disabled={busy}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-invalid={!!fieldErrors.username}
                    aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--fg)] outline-none placeholder:text-faint"
                    placeholder="admin username"
                  />
                </Field>

                <Field
                  id="password"
                  label="Password"
                  icon={KeyRound}
                  error={fieldErrors.password}
                  hint={
                    capsLock ? (
                      <span className="flex items-center gap-1.5 text-[12px] text-warn">
                        <TriangleAlert className="h-3.5 w-3.5" /> Caps Lock is on
                      </span>
                    ) : null
                  }
                >
                  <input
                    ref={passRef}
                    id="password"
                    name="password"
                    type={reveal ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    disabled={busy}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={onKey}
                    onKeyDown={onKey}
                    aria-invalid={!!fieldErrors.password}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--fg)] outline-none placeholder:text-faint"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    aria-label={reveal ? 'Hide password' : 'Show password'}
                    aria-pressed={reveal}
                    className="-mr-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-faint transition hover:bg-mist/[0.06] hover:text-[var(--fg)]"
                  >
                    {reveal ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </Field>

                <div aria-live="polite" className="min-h-0">
                  {status.kind === 'error' && (
                    <p
                      role="alert"
                      className="flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-[13.5px] text-bad"
                    >
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      {status.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className={cn(
                    'btn-shimmer group flex h-[54px] items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white transition',
                    status.kind === 'success'
                      ? 'bg-ok text-brand-950'
                      : 'bg-grad-primary shadow-[0_18px_40px_-18px_rgb(var(--lime-rgb)/0.95)] hover:brightness-110 disabled:opacity-80'
                  )}
                >
                  {status.kind === 'loading' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Verifying…
                    </>
                  ) : status.kind === 'success' ? (
                    <>
                      <Check className="h-5 w-5" /> Signed in
                    </>
                  ) : (
                    <>
                      Sign in to console
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <p className="mt-5 px-2 text-center text-[12.5px] leading-relaxed text-faint">
              Admin credentials are issued by the site administrator. Failed attempts are
              rate-limited and sessions expire after 12 hours.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
