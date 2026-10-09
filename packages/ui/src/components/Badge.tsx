import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const badgeVariants = cva(
  'inline-flex items-center font-mono font-medium text-[11px] leading-none px-2 py-1 rounded-[4px] uppercase tracking-[0.04em] whitespace-nowrap select-none',
  {
    variants: {
      variant: {
        ok: 'bg-[var(--ok-bg)] text-[var(--ok)]',
        warn: 'bg-[var(--warn-bg)] text-[var(--warn)]',
        bad: 'bg-[var(--bad-bg)] text-[var(--bad)]',
        mute: 'bg-[var(--soft)] text-[var(--muted)]',
        lime: 'bg-[var(--lime)] text-white',
        glass:
          'bg-[rgb(var(--white-rgb)/0.12)] border border-[rgb(var(--white-rgb)/0.18)] backdrop-blur-md text-white rounded-full px-2.5 py-1.5 normal-case',
      },
    },
    defaultVariants: {
      variant: 'ok',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  dot,
  dotColor,
  children,
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant, className }))} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
};
