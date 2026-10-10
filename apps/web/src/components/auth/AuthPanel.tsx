import React from 'react';
import { Kicker } from '@ascend/ui';

/** Centred glass card used by the small account pages (verify email, forgot / reset password). */
export function AuthPanel({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grain relative -mt-[72px] overflow-hidden pt-[72px]">
      <div className="aurora" aria-hidden>
        <i />
      </div>
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-72px)] max-w-[560px] flex-col justify-center px-5 py-16">
        <div className="relative">
          <div aria-hidden className="pointer-events-none absolute -inset-6 rounded-[48px] bg-brand-500/20 blur-[80px]" />
          <div className="glass-panel relative overflow-hidden rounded-[32px] p-7 shadow-[0_40px_90px_-40px_rgb(var(--black-rgb)/0.9)] sm:p-10">
            <Kicker tone="gold">{kicker}</Kicker>
            <h1 className="mt-4 font-display text-[clamp(30px,5vw,44px)] font-medium leading-[1.02] tracking-[-0.045em] text-[var(--fg)]">{title}</h1>
            <div className="mt-6 flex flex-col gap-5 text-[15px] leading-relaxed text-[var(--muted)]">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const authInputClass =
  'w-full rounded-2xl border border-mist/[0.12] bg-field/80 px-4 py-4 text-[15px] text-white outline-none transition placeholder:text-faint focus:border-brand-500 focus:shadow-[0_0_0_4px_rgb(var(--lime-rgb)/0.18)]';
export const authButtonClass =
  'btn-shimmer flex h-14 w-full items-center justify-center gap-2 rounded-full bg-grad-primary px-6 text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgb(var(--lime-rgb)/0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60';
