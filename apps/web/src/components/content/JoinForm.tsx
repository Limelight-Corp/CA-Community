'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react';
import { FormField, cn, fieldInputClass } from '@ascend/ui';
import { HONEYPOT_FIELD, fieldErrors, memberApplicationSchema } from '../../lib/form-schemas';

type PlanKey = 'core' | 'associate' | 'student';

export interface JoinFormProps {
  plans: { key: PlanKey; name: string; audience: string; priceLabel: string }[];
  wings: { number: number; name: string; color: string }[];
  initialPlan?: PlanKey;
}

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'done'; duplicate: boolean; message?: string } | { kind: 'error'; message: string };

const TEXT_FIELDS = [
  { name: 'name', label: 'Full name', required: true, autoComplete: 'name', type: 'text', span: true },
  { name: 'email', label: 'Email', required: true, autoComplete: 'email', type: 'email' },
  { name: 'mobile', label: 'Mobile number', required: true, autoComplete: 'tel', type: 'tel', inputMode: 'tel' as const },
  { name: 'city', label: 'City', required: true, autoComplete: 'address-level2', type: 'text' },
  { name: 'membershipNo', label: 'CA membership number', hint: 'ICAI membership / registration number, if applicable', type: 'text' },
  { name: 'qualificationYear', label: 'Year of qualification', type: 'text', inputMode: 'numeric' as const, placeholder: 'e.g. 2021' },
  { name: 'areaOfPractice', label: 'Area of practice', type: 'text', placeholder: 'e.g. Direct tax, audit, advisory' },
  { name: 'organisation', label: 'Firm / company', autoComplete: 'organization', type: 'text' },
  { name: 'linkedinUrl', label: 'LinkedIn profile', type: 'url', placeholder: 'https://linkedin.com/in/…' },
] as const;

export function JoinForm({ plans, wings, initialPlan }: JoinFormProps) {
  const [plan, setPlan] = useState<PlanKey | ''>(initialPlan ?? '');
  const [interests, setInterests] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const toggleInterest = (n: number) =>
    setInterests((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      mobile: String(fd.get('mobile') ?? ''),
      city: String(fd.get('city') ?? ''),
      plan,
      membershipNo: String(fd.get('membershipNo') ?? ''),
      qualificationYear: String(fd.get('qualificationYear') ?? ''),
      areaOfPractice: String(fd.get('areaOfPractice') ?? ''),
      organisation: String(fd.get('organisation') ?? ''),
      linkedinUrl: String(fd.get('linkedinUrl') ?? ''),
      interests,
      consent: fd.get('consent') === 'on',
      [HONEYPOT_FIELD]: String(fd.get(HONEYPOT_FIELD) ?? ''),
    };

    const check = memberApplicationSchema.safeParse(payload);
    if (!check.success) {
      const errs = fieldErrors(check.error);
      setErrors(errs);
      setStatus({ kind: 'error', message: 'Please check the highlighted fields.' });
      const first = Object.keys(errs)[0];
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; status?: string; message?: string; error?: string; fieldErrors?: Record<string, string> };
      if (res.ok && json.success) {
        setStatus({ kind: 'done', duplicate: json.status === 'duplicate', message: json.message });
        requestAnimationFrame(() => statusRef.current?.focus());
        return;
      }
      if (json.fieldErrors) setErrors(json.fieldErrors);
      setStatus({ kind: 'error', message: json.error || 'We could not submit your application. Please try again.' });
    } catch {
      setStatus({ kind: 'error', message: 'Network error — please check your connection and try again.' });
    }
  }

  if (status.kind === 'done') {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="grain relative overflow-hidden rounded-[32px] border border-gold/30 bg-grad-surface p-8 outline-none md:p-14"
      >
        <div className="aurora opacity-70" aria-hidden>
          <i />
        </div>
        <div className="relative z-10 flex max-w-[60ch] flex-col gap-5">
          <CheckCircle2 className="h-12 w-12 text-gold" aria-hidden />
          <h3 className="font-display text-[clamp(32px,4.4vw,56px)] font-medium leading-[0.98] tracking-[-0.045em] text-[var(--fg)]">
            {status.duplicate ? 'We already have you.' : 'Application received.'}{' '}
            <em className="font-serif font-normal italic text-gold-gradient">Welcome aboard.</em>
          </h3>
          <p className="text-[16px] leading-relaxed text-[var(--muted)]">
            {status.duplicate
              ? status.message
              : 'Thank you for applying. Our membership team will review your details and follow up with the next steps, including your plan and payment details. No payment has been taken.'}
          </p>
          <p className="text-[14px] text-[var(--muted)]">You’ll be able to add a profile photo once your membership is set up.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/events" className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white">
              Explore events <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/about#wings" className="inline-flex h-11 items-center rounded-full border border-mist/[0.18] px-5 text-[14px] font-semibold text-[var(--fg)]">
              Meet the wings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const submitting = status.kind === 'submitting';

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative flex flex-col gap-10" aria-describedby="join-form-required">
      <p id="join-form-required" className="text-[13px] text-[var(--muted)]">
        Fields marked <span className="text-gold">*</span> are required.
      </p>

      {/* Plan */}
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">
          1. Choose your plan<span className="text-gold" aria-hidden> *</span>
        </legend>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-required="true" aria-describedby={errors.plan ? 'plan-error' : undefined}>
          {plans.map((p) => {
            const active = plan === p.key;
            return (
              <label
                key={p.key}
                className={cn(
                  'relative flex cursor-pointer flex-col gap-1 rounded-[22px] border p-5 transition focus-within:ring-2 focus-within:ring-brand-300',
                  active ? 'border-gold/70 bg-gold/10' : 'border-mist/[0.12] hover:border-mist/40'
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.key}
                  checked={active}
                  onChange={() => setPlan(p.key)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-3">
                  <span className="font-display text-[19px] font-medium text-[var(--fg)]">{p.name}</span>
                  <span
                    aria-hidden
                    className={cn('grid h-6 w-6 place-items-center rounded-full border', active ? 'border-gold bg-gold text-brand-950' : 'border-mist/[0.2]')}
                  >
                    {active && <Check className="h-3.5 w-3.5" />}
                  </span>
                </span>
                <span className="text-[13px] text-[var(--muted)]">{p.audience}</span>
                <span className="mt-2 font-mono text-[12px] text-gold-soft">{p.priceLabel}</span>
              </label>
            );
          })}
        </div>
        {errors.plan && (
          <span id="plan-error" role="alert" className="text-[12px] text-bad">
            {errors.plan}
          </span>
        )}
      </fieldset>

      {/* Details */}
      <fieldset className="flex flex-col">
        <legend className="mb-5 font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">2. Your details</legend>
        <div className="grid gap-5 md:grid-cols-2">
          {TEXT_FIELDS.map((f) => (
            <FormField
              key={f.name}
              id={`join-${f.name}`}
              label={f.label}
              required={'required' in f && f.required}
              hint={'hint' in f ? f.hint : undefined}
              error={errors[f.name]}
              className={'span' in f && f.span ? 'md:col-span-2' : undefined}
            >
              {(control) => (
                <input
                  {...control}
                  name={f.name}
                  type={f.type}
                  autoComplete={'autoComplete' in f ? f.autoComplete : undefined}
                  inputMode={'inputMode' in f ? f.inputMode : undefined}
                  placeholder={'placeholder' in f ? f.placeholder : undefined}
                  className={fieldInputClass}
                />
              )}
            </FormField>
          ))}
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-mist/[0.14] p-4 text-[13.5px] text-[var(--muted)] md:col-span-2">
            <ImagePlus className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" aria-hidden />
            Profile photo: you can add one to your member profile once your membership is confirmed.
          </div>
        </div>
      </fieldset>

      {/* Interests */}
      <fieldset className="flex flex-col">
        <legend className="mb-2 font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">3. Your interests</legend>
        <p className="mb-5 text-[13.5px] text-[var(--muted)]">Pick the wings you’d like to be part of — choose as many as you like.</p>
        <div className="flex flex-wrap gap-2.5">
          {wings.map((w) => {
            const on = interests.includes(w.number);
            return (
              <label
                key={w.number}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-[13.5px] transition focus-within:ring-2 focus-within:ring-brand-300',
                  on ? 'border-transparent text-[var(--fg)]' : 'border-mist/[0.14] text-[var(--muted)] hover:text-[var(--fg)]'
                )}
                style={on ? { background: `color-mix(in srgb, ${w.color} 28%, transparent)`, boxShadow: `inset 0 0 0 1px ${w.color}` } : undefined}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleInterest(w.number)} name="interests" value={w.number} />
                <span className="h-2 w-2 rounded-full" style={{ background: w.color }} aria-hidden />
                {w.name}
                {on && <Check className="h-3.5 w-3.5" aria-hidden />}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Honeypot — hidden from people and assistive tech */}
      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="join-website">Website</label>
        <input id="join-website" type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>

      {/* Consent */}
      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-[var(--muted)]">
          <input
            type="checkbox"
            name="consent"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--lime)]"
          />
          <span>
            I agree that the community may store and use these details to process my membership application, as described in the{' '}
            <Link href="/legal/privacy" className="text-brand-200 underline underline-offset-4 hover:text-white">
              Privacy Policy
            </Link>
            .<span className="text-gold" aria-hidden> *</span>
          </span>
        </label>
        {errors.consent && (
          <span id="consent-error" role="alert" className="text-[12px] text-bad">
            {errors.consent}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-[1.5em] text-[14px]">
          {status.kind === 'error' && <span className="text-bad">{status.message}</span>}
          {submitting && <span className="text-[var(--muted)]">Submitting your application…</span>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex h-14 items-center justify-between gap-6 rounded-full bg-grad-gold pl-7 pr-2 text-[15.5px] font-semibold text-brand-950 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
        >
          Submit application
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-950 text-gold transition-transform duration-300 group-hover:rotate-45">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ArrowUpRight className="h-5 w-5" aria-hidden />}
          </span>
        </button>
      </div>
    </form>
  );
}
