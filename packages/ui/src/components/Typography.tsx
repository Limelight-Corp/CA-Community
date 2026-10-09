import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const headingVariants = cva(
  'font-display font-medium leading-[1.06] tracking-[-0.03em] text-balance text-[var(--fg)]',
  {
    variants: {
      level: {
        h1: 'text-[clamp(42px,6cqi,76px)] tracking-[-0.045em] leading-[1.02]',
        h2: 'text-[clamp(32px,4.2cqi,52px)] tracking-[-0.04em] leading-[1.05]',
        h3: 'text-[clamp(20px,2.2cqi,28px)] tracking-[-0.02em]',
        h4: 'text-[18px] tracking-[-0.015em]',
      },
    },
    defaultVariants: {
      level: 'h2',
    },
  }
);

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export const Heading: React.FC<HeadingProps> = ({
  as: Component = 'h2',
  level,
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(headingVariants({ level: level || (Component as any), className }))}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  pill?: boolean;
}

export const Eyebrow: React.FC<EyebrowProps> = ({ pill = false, className, children, ...props }) => {
  if (pill) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 py-1.5 px-3 rounded-full font-mono text-[11.5px] font-medium leading-none tracking-[0.06em] uppercase',
          'text-brand-100 bg-[rgb(var(--lime-rgb)/0.12)] border border-[rgb(var(--brand-300-rgb)/0.28)]',
          'before:content-[""] before:w-1.5 before:h-1.5 before:rounded-full before:bg-brand-300 before:shadow-[0_0_8px_var(--brand-300)]',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'font-mono text-[12px] font-medium leading-none tracking-[0.08em] uppercase text-[var(--muted)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const Text: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn('text-[var(--muted)] text-[16px] leading-[1.65] text-pretty', className)}
      {...props}
    >
      {children}
    </p>
  );
};
