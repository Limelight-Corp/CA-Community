import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const cardVariants = cva(
  'border border-[var(--line)] rounded-[var(--r)] transition-all duration-200 relative overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-[linear-gradient(180deg,rgba(219,231,240,0.05),rgba(219,231,240,0.015)),var(--card)] text-[var(--fg)]',
        dark: 'bg-[radial-gradient(120%_120%_at_0%_0%,#1A3BB8_0%,#0C1A58_45%,#060A1F_100%)] text-[var(--on-ink)]',
        soft: 'bg-[linear-gradient(180deg,rgba(219,231,240,0.05),rgba(219,231,240,0.015)),var(--card)]',
        tile: 'aspect-[4/3] bg-[radial-gradient(90%_90%_at_80%_10%,rgba(47,91,255,0.45),transparent_60%),linear-gradient(160deg,#0C1A58,#060A1F)] grid place-items-center text-[var(--faint)]',
        glass:
          'bg-[rgba(3,5,15,0.72)] backdrop-blur-[18px] border border-[var(--line)] text-[var(--fg)]',
      },
      interactive: {
        true: 'cursor-pointer hover:border-[rgba(157,182,255,0.35)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(47,91,255,0.4)]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, interactive, className }))}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
