import React from 'react';
import { cn, getInitials } from '../utils';

/* ------------------------------------------------------------------------------------------ */
/* Container                                                                                   */
/* ------------------------------------------------------------------------------------------ */

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'wide' | 'narrow';
}

export const Container: React.FC<ContainerProps> = ({ size = 'default', className, ...props }) => (
  <div
    className={cn(
      'mx-auto w-full px-5 md:px-8',
      size === 'default' && 'max-w-[1200px]',
      size === 'wide' && 'max-w-[1400px]',
      size === 'narrow' && 'max-w-[820px]',
      className
    )}
    {...props}
  />
);

/* ------------------------------------------------------------------------------------------ */
/* AccentText — serif italic gradient emphasis used inside headings                           */
/* ------------------------------------------------------------------------------------------ */

export interface AccentTextProps extends React.HTMLAttributes<HTMLElement> {
  tone?: 'blue' | 'gold' | 'hero';
}

export const AccentText: React.FC<AccentTextProps> = ({ tone = 'blue', className, ...props }) => (
  <em
    className={cn(
      'font-serif italic font-normal tracking-[-0.015em] pr-[0.06em]',
      tone === 'blue' && 'text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist',
      tone === 'gold' && 'text-gold-gradient',
      tone === 'hero' && 'text-hero-gradient',
      className
    )}
    {...props}
  />
);

/* ------------------------------------------------------------------------------------------ */
/* SectionHeading                                                                              */
/* ------------------------------------------------------------------------------------------ */

export interface SectionHeadingProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  accent?: React.ReactNode;
  accentTone?: AccentTextProps['tone'];
  lead?: React.ReactNode;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
  size?: 'md' | 'lg' | 'xl';
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  accent,
  accentTone = 'blue',
  lead,
  align = 'left',
  as: Tag = 'h2',
  size = 'md',
  action,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col gap-5',
      align === 'center' && 'items-center text-center',
      action && 'md:flex-row md:items-end md:justify-between',
      className
    )}
  >
    <div className={cn('flex flex-col gap-5', align === 'center' ? 'items-center' : 'max-w-4xl')}>
      {eyebrow && <Kicker>{eyebrow}</Kicker>}
      <Tag
        className={cn(
          'font-display font-medium text-[var(--fg)]',
          size === 'md' && 'text-[clamp(30px,4vw,52px)] leading-[1.04] tracking-[-0.04em]',
          size === 'lg' && 'text-[clamp(36px,5vw,76px)] leading-[1] tracking-[-0.045em]',
          size === 'xl' && 'text-[clamp(44px,7vw,104px)] leading-[0.94] tracking-[-0.05em]',
          align === 'center' ? 'max-w-[28ch]' : 'max-w-[42ch]'
        )}
      >
        {title}
        {accent && (
          <>
            {' '}
            <AccentText tone={accentTone}>{accent}</AccentText>
          </>
        )}
      </Tag>
      {lead && (
        <p
          className={cn(
            'text-[clamp(16px,1.35vw,19px)] leading-relaxed text-[var(--muted)]',
            align === 'center' ? 'max-w-[64ch]' : 'max-w-[44ch]'
          )}
        >
          {lead}
        </p>
      )}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------------------------------ */
/* Kicker — editorial section label: a short rule, then small spaced capitals                 */
/* ------------------------------------------------------------------------------------------ */

export interface KickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'blue' | 'gold';
}

export const Kicker: React.FC<KickerProps> = ({ tone = 'blue', className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex w-fit items-center gap-3 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.18em]',
      tone === 'blue' ? 'text-brand-500' : 'text-gold',
      className
    )}
    {...props}
  >
    <span aria-hidden className="h-px w-7 shrink-0 bg-current opacity-60" />
    {children}
  </span>
);

/* ------------------------------------------------------------------------------------------ */
/* EmptyState                                                                                  */
/* ------------------------------------------------------------------------------------------ */

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-3 rounded-[var(--r)] border border-dashed border-mist/[0.14] px-6 py-14 text-center',
      className
    )}
  >
    {icon && <div className="mb-1 text-brand-200 [&_svg]:h-8 [&_svg]:w-8">{icon}</div>}
    <p className="font-display text-[20px] font-medium text-[var(--fg)]">{title}</p>
    {description && <p className="max-w-[46ch] text-[14.5px] text-[var(--muted)]">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------------------------------ */
/* Skeleton                                                                                    */
/* ------------------------------------------------------------------------------------------ */

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div aria-hidden className={cn('animate-pulse rounded-md bg-mist/[0.07]', className)} {...props} />
);

/* ------------------------------------------------------------------------------------------ */
/* Avatar — photo with initials fallback                                                       */
/* ------------------------------------------------------------------------------------------ */

export interface AvatarProps {
  name: string;
  src?: string;
  size?: number;
  className?: string;
  rounded?: 'full' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 56, className, rounded = 'full' }) => (
  <span
    className={cn(
      'relative grid shrink-0 place-items-center overflow-hidden border border-[var(--line)] bg-grad-avatar font-display font-medium text-white',
      rounded === 'full' ? 'rounded-full' : 'rounded-2xl',
      className
    )}
    style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
  >
    {src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
    ) : (
      <span aria-hidden>{getInitials(name) || 'CA'}</span>
    )}
  </span>
);

/* ------------------------------------------------------------------------------------------ */
/* Stepper                                                                                     */
/* ------------------------------------------------------------------------------------------ */

export interface StepperProps {
  steps: { label: string; description?: string }[];
  current: number;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ steps, current, className }) => (
  <ol className={cn('flex w-full items-center gap-2', className)}>
    {steps.map((step, i) => {
      const state = i < current ? 'done' : i === current ? 'current' : 'todo';
      return (
        <li
          key={step.label}
          aria-current={state === 'current' ? 'step' : undefined}
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          <span
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full font-mono text-[12px] font-semibold border transition-colors',
              state === 'done' && 'bg-ok/15 border-ok/40 text-ok',
              state === 'current' && 'bg-brand-500 border-brand-500 text-white shadow-[0_0_20px_rgb(var(--lime-rgb)/0.6)]',
              state === 'todo' && 'border-mist/[0.16] text-[var(--muted)]'
            )}
          >
            {state === 'done' ? '✓' : i + 1}
          </span>
          <span
            className={cn(
              'truncate text-[13px] font-medium',
              state === 'todo' ? 'text-[var(--muted)]' : 'text-[var(--fg)]'
            )}
          >
            {step.label}
          </span>
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={cn('mx-1 hidden h-px flex-1 sm:block', i < current ? 'bg-ok/50' : 'bg-mist/[0.12]')}
            />
          )}
        </li>
      );
    })}
  </ol>
);

/* ------------------------------------------------------------------------------------------ */
/* FormField — label, hint and error wired to the control with ids                            */
/* ------------------------------------------------------------------------------------------ */

export interface FormFieldControlProps {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
}

export interface FormFieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  children: (control: FormFieldControlProps) => React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ id, label, hint, error, required, className, children }) => {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-[var(--fg)]">
        {label}
        {required && <span className="ml-0.5 text-gold" aria-hidden> *</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, required })}
      {hint && !error && (
        <span id={hintId} className="text-[12px] text-[var(--muted)]">
          {hint}
        </span>
      )}
      {error && (
        <span id={errorId} role="alert" className="text-[12px] text-bad">
          {error}
        </span>
      )}
    </div>
  );
};

/** Shared text-input styling for forms built with FormField. */
export const fieldInputClass =
  'w-full rounded-2xl border border-mist/[0.12] bg-field/80 px-4 py-3.5 text-[15px] text-[var(--fg)] placeholder:text-faint outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 aria-[invalid=true]:border-bad';
