'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Loader2, Lock, Ticket } from 'lucide-react';
import { FormField, Stepper, cn, fieldInputClass } from '@ascend/ui';
import { trackEvent } from '../site/Providers';
import { useAuth } from '../../context/AuthContext';

export interface RegistrationEventSummary {
  slug: string;
  title: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  fee: number;
  feeLabel: string;
}

export interface RegistrationFormProps {
  event: RegistrationEventSummary;
  siteName: string;
}

type Values = {
  name: string;
  membershipNo: string;
  email: string;
  mobile: string;
  city: string;
  organisation: string;
  designation: string;
  requirements: string;
  acceptTerms: boolean;
  website: string;
};

type FieldKey = keyof Values;
type Errors = Partial<Record<FieldKey, string>>;

interface Booking {
  bookingId: string;
  accessToken: string;
  status: 'confirmed' | 'pending_payment' | 'cancelled';
  paymentStatus: string;
  fee: number;
  duplicate?: boolean;
}

const EMPTY: Values = {
  name: '',
  membershipNo: '',
  email: '',
  mobile: '',
  city: '',
  organisation: '',
  designation: '',
  requirements: '',
  acceptTerms: false,
  website: '',
};

const STEPS = [{ label: 'Details' }, { label: 'Payment' }, { label: 'Confirmed' }];
const FIELD_ORDER: FieldKey[] = ['name', 'membershipNo', 'email', 'mobile', 'city', 'organisation', 'designation', 'requirements', 'acceptTerms'];

const normaliseMobile = (v: string) => v.replace(/\D/g, '').replace(/^(?:91|0)(?=\d{10}$)/, '');

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = 'Enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Enter a valid email address';
  if (!/^[6-9]\d{9}$/.test(normaliseMobile(v.mobile))) e.mobile = 'Enter a valid 10-digit Indian mobile number';
  if (v.city.trim().length < 2) e.city = 'Enter your city';
  if (v.requirements.length > 1000) e.requirements = 'Please keep this under 1000 characters';
  if (!v.acceptTerms) e.acceptTerms = 'Please accept the event terms to continue';
  return e;
}

const receiptUrl = (b: Pick<Booking, 'bookingId' | 'accessToken'>) =>
  `/registration/${encodeURIComponent(b.bookingId)}?t=${encodeURIComponent(b.accessToken)}`;

/** The separate payment page (asks the visitor to log in first). */
const payUrl = (b: Pick<Booking, 'bookingId' | 'accessToken'>) =>
  `/registration/${encodeURIComponent(b.bookingId)}/pay?t=${encodeURIComponent(b.accessToken)}`;

const storageKey = (slug: string) => `ascend:booking:${slug}`;

/**
 * Event registration: Details → Payment → Confirmed (Website Checklist §27).
 * This form only saves the details. Paid events then continue on the separate payment page.
 */
export function RegistrationForm({ event }: RegistrationFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [saved, setSaved] = useState<{ bookingId: string; accessToken: string } | null>(null);
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // A previous booking for this event on this device.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(event.slug));
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, [event.slug]);

  // Pre-fill from the signed-in member's profile (only fields the visitor hasn't typed yet).
  useEffect(() => {
    if (!user) return;
    const mobile = user.mobile ? normaliseMobile(user.mobile) : '';
    // Prototype logins without an email get a placeholder address — don't use it.
    const email = user.email && !user.email.endsWith('@ascend-mobile.in') ? user.email : '';
    const name = /^CA Member( \d{4})?$/.test(user.name) ? '' : user.name;
    setValues((v) => ({
      ...v,
      name: v.name || name,
      email: v.email || email,
      mobile: v.mobile || mobile,
    }));
  }, [user]);

  const step = !booking ? 0 : booking.status === 'confirmed' ? 2 : 1;

  const set = <K extends FieldKey>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onFirstInteraction = () => {
    if (started.current) return;
    started.current = true;
    trackEvent('begin_registration', { event_slug: event.slug, value: event.fee, currency: 'INR' });
  };

  const focusFirstError = (errs: Errors) => {
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onFirstInteraction();
    setFormError('');
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstError(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, mobile: normaliseMobile(values.mobile), eventSlug: event.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fe = (data.fieldErrors || {}) as Errors;
        setErrors(fe);
        setFormError(data.error || 'Something went wrong. Please try again.');
        focusFirstError(fe);
        return;
      }

      const b = data as Booking;
      setBooking(b);
      try {
        localStorage.setItem(storageKey(event.slug), JSON.stringify({ bookingId: b.bookingId, accessToken: b.accessToken }));
      } catch {
        /* storage unavailable */
      }
      if (!b.duplicate) {
        trackEvent('registration_complete', { event_slug: event.slug, value: b.fee, currency: 'INR', transaction_id: b.bookingId });
      }
      requestAnimationFrame(() => panelRef.current?.focus());

      // Free → pass; paid → the payment page, where the visitor logs in and pays.
      router.push(b.status === 'confirmed' ? receiptUrl(b) : payUrl(b));
    } catch {
      setFormError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------------------------- */

  const input = (key: Exclude<FieldKey, 'acceptTerms'>, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) =>
    function Control(control: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean; required?: boolean }) {
      return (
        <input
          {...control}
          {...extra}
          name={key}
          value={values[key]}
          onChange={(ev) => set(key, ev.target.value)}
          onFocus={onFirstInteraction}
          className={fieldInputClass}
        />
      );
    };

  return (
    <div className="flex flex-col gap-8">
      <Stepper steps={STEPS} current={step} className="max-w-[560px]" />

      {saved && !booking && (
        <div className="flex flex-col gap-3 rounded-[22px] border border-brand-300/30 bg-brand-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-[var(--fg-soft)]">
            You registered for this event on this device — booking <span className="font-mono text-[var(--fg)]">{saved.bookingId}</span>.
          </p>
          <Link
            href={receiptUrl(saved)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-mist/[0.16] px-4 text-[13.5px] font-semibold text-[var(--fg)] hover:border-mist/40"
          >
            View booking <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      {!booking ? (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-describedby={formError ? 'form-error' : undefined}>
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="mb-5 font-display text-[clamp(24px,2.6vw,32px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
              Your details
            </legend>
            <FormField id="reg-name" label="Full name" required error={errors.name} className="sm:col-span-2">
              {input('name', { autoComplete: 'name', autoCapitalize: 'words', placeholder: 'As it should appear on your pass', maxLength: 100 })}
            </FormField>
            <FormField id="reg-email" label="Email" required error={errors.email}>
              {input('email', { type: 'email', autoComplete: 'email', inputMode: 'email', placeholder: 'you@example.com', maxLength: 160 })}
            </FormField>
            <FormField id="reg-mobile" label="Mobile" required error={errors.mobile} hint="10-digit Indian mobile number">
              {input('mobile', { type: 'tel', autoComplete: 'tel-national', inputMode: 'numeric', placeholder: '98765 43210', maxLength: 16 })}
            </FormField>
            <FormField id="reg-city" label="City" required error={errors.city}>
              {input('city', { autoComplete: 'address-level2', autoCapitalize: 'words', maxLength: 80 })}
            </FormField>
            <FormField id="reg-membership" label="Membership / registration no." error={errors.membershipNo} hint="Optional">
              {input('membershipNo', { autoCapitalize: 'characters', maxLength: 40 })}
            </FormField>
            <FormField id="reg-org" label="Firm / organisation" error={errors.organisation} hint="Optional">
              {input('organisation', { autoComplete: 'organization', maxLength: 120 })}
            </FormField>
            <FormField id="reg-designation" label="Designation" error={errors.designation} hint="Optional">
              {input('designation', { autoComplete: 'organization-title', maxLength: 120 })}
            </FormField>
            <FormField
              id="reg-req"
              label="Special requirements"
              error={errors.requirements}
              hint="Optional — accessibility, dietary or anything else we should know"
              className="sm:col-span-2"
            >
              {(control) => (
                <textarea
                  {...control}
                  name="requirements"
                  rows={3}
                  maxLength={1000}
                  value={values.requirements}
                  onChange={(ev) => set('requirements', ev.target.value)}
                  onFocus={onFirstInteraction}
                  className={cn(fieldInputClass, 'resize-y')}
                />
              )}
            </FormField>
          </fieldset>

          {/* Honeypot — hidden from people and assistive tech */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="reg-website">Website</label>
            <input
              id="reg-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(ev) => set('website', ev.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-[var(--fg-soft)]">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={values.acceptTerms}
                onChange={(ev) => set('acceptTerms', ev.target.checked)}
                aria-invalid={errors.acceptTerms ? true : undefined}
                aria-describedby={errors.acceptTerms ? 'reg-terms-error' : undefined}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--brand-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
              />
              <span>
                I agree to the{' '}
                <Link href="/legal/event-terms" target="_blank" className="text-brand-200 underline underline-offset-4 hover:text-[var(--fg)]">
                  event registration terms
                </Link>{' '}
                and consent to being contacted about this event.
              </span>
            </label>
            {errors.acceptTerms && (
              <span id="reg-terms-error" role="alert" className="pl-8 text-[12px] text-bad">
                {errors.acceptTerms}
              </span>
            )}
          </div>

          <div aria-live="assertive">
            {formError && (
              <p id="form-error" className="flex items-start gap-2 rounded-2xl border border-bad/30 bg-bad/10 px-4 py-3 text-[14px] text-bad">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {formError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="group inline-flex h-14 w-full items-center justify-between gap-2 rounded-full bg-grad-primary pl-6 pr-2 text-[16px] font-semibold text-white shadow-[0_14px_36px_-12px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:min-w-[320px]"
          >
            <span className="inline-flex items-center gap-2">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Ticket className="h-5 w-5" aria-hidden />}
              {submitting ? 'Saving your details…' : event.fee > 0 ? `Continue to payment · ${event.feeLabel}` : 'Confirm free registration'}
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:translate-x-0.5">
              <ArrowRight className="h-5 w-5" aria-hidden />
            </span>
          </button>
          <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)]">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Your details are used only for this event and never shown publicly.
            {event.fee > 0 && ' Payment happens on the next page — UPI, cards or net banking.'}
          </p>
        </form>
      ) : (
        <div ref={panelRef} tabIndex={-1} className="rounded-[28px] border border-mist/[0.12] bg-grad-surface p-6 outline-none md:p-8" aria-live="polite">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-gold">Booking ID</p>
          <p className="mt-1 break-all font-display text-[clamp(26px,4vw,40px)] font-semibold tracking-[-0.03em] text-[var(--fg)]">{booking.bookingId}</p>
          {booking.duplicate && (
            <p className="mt-3 text-[14px] text-[var(--muted)]">You were already registered for this event — here is your existing booking.</p>
          )}

          <p className="mt-5 inline-flex items-center gap-2 text-[15px] text-[var(--fg-soft)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {booking.status === 'confirmed' ? 'Confirmed — opening your pass…' : 'Details saved — opening the payment page…'}
          </p>
        </div>
      )}
    </div>
  );
}
