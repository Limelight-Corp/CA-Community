'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CheckCircle2, Loader2 } from 'lucide-react';
import { FormField, fieldInputClass } from '@ascend/ui';
import { HONEYPOT_FIELD, contactMessageSchema, fieldErrors } from '../../lib/form-schemas';

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'done' } | { kind: 'error'; message: string };

export function ContactForm({ defaultSubject = '' }: { defaultSubject?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      subject: String(fd.get('subject') ?? ''),
      message: String(fd.get('message') ?? ''),
      [HONEYPOT_FIELD]: String(fd.get(HONEYPOT_FIELD) ?? ''),
    };
    const check = contactMessageSchema.safeParse(payload);
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
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string; fieldErrors?: Record<string, string> };
      if (res.ok && json.success) {
        setStatus({ kind: 'done' });
        requestAnimationFrame(() => doneRef.current?.focus());
        return;
      }
      if (json.fieldErrors) setErrors(json.fieldErrors);
      setStatus({ kind: 'error', message: json.error || 'We could not send your message. Please try again.' });
    } catch {
      setStatus({ kind: 'error', message: 'Network error — please check your connection and try again.' });
    }
  }

  if (status.kind === 'done') {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" aria-live="polite" className="flex flex-col gap-5 outline-none">
        <CheckCircle2 className="h-12 w-12 text-gold" aria-hidden />
        <h3 className="font-display text-[clamp(30px,4vw,48px)] font-medium leading-[1] tracking-[-0.045em] text-[var(--fg)]">
          Message received. <em className="font-serif font-normal italic text-gold-gradient">Thank you.</em>
        </h3>
        <p className="max-w-[52ch] text-[16px] leading-relaxed text-[var(--muted)]">
          Your message has reached our team and someone will get back to you on the email you shared.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setStatus({ kind: 'idle' })}
            className="inline-flex h-11 items-center rounded-full border border-mist/[0.18] px-5 text-[14px] font-semibold text-[var(--fg)] hover:border-mist/50"
          >
            Send another message
          </button>
          <Link href="/events" className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white">
            Explore events <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const submitting = status.kind === 'submitting';

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="relative grid gap-5 md:grid-cols-2">
      <FormField id="contact-name" label="Name" required error={errors.name}>
        {(c) => <input {...c} name="name" type="text" autoComplete="name" className={fieldInputClass} />}
      </FormField>
      <FormField id="contact-email" label="Email" required error={errors.email}>
        {(c) => <input {...c} name="email" type="email" autoComplete="email" className={fieldInputClass} />}
      </FormField>
      <FormField id="contact-phone" label="Phone" hint="Optional" error={errors.phone}>
        {(c) => <input {...c} name="phone" type="tel" inputMode="tel" autoComplete="tel" className={fieldInputClass} />}
      </FormField>
      <FormField id="contact-subject" label="Subject" required error={errors.subject}>
        {(c) => <input {...c} name="subject" type="text" defaultValue={defaultSubject} className={fieldInputClass} />}
      </FormField>
      <FormField id="contact-message" label="Message" required error={errors.message} className="md:col-span-2">
        {(c) => <textarea {...c} name="message" rows={6} className={`${fieldInputClass} resize-y`} />}
      </FormField>

      <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-[12.5px] leading-relaxed text-[var(--muted)] md:col-span-2">
        We use your details only to reply to you. See our{' '}
        <Link href="/legal/privacy" className="text-brand-200 underline underline-offset-4 hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
        <div aria-live="polite" className="min-h-[1.5em] text-[14px]">
          {status.kind === 'error' && <span className="text-bad">{status.message}</span>}
          {submitting && <span className="text-[var(--muted)]">Sending…</span>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="group inline-flex h-13 min-h-[52px] items-center justify-between gap-6 rounded-full bg-grad-primary pl-6 pr-1.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-60"
        >
          Send message
          <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-300 group-hover:rotate-45">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ArrowUpRight className="h-5 w-5" aria-hidden />}
          </span>
        </button>
      </div>
    </form>
  );
}
