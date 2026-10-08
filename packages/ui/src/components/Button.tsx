import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 rounded-full font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap text-decoration-none disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        lime: 'bg-gradient-to-b from-[#4A72FF] via-[#2F5BFF] to-[#0F38C0] text-white shadow-[0_10px_28px_-12px_rgba(47,91,255,0.9)] border border-transparent hover:brightness-110 active:brightness-95',
        dark: 'bg-gradient-to-b from-[#4A72FF] via-[#2F5BFF] to-[#0F38C0] text-white shadow-[0_10px_28px_-12px_rgba(47,91,255,0.9)] border border-transparent hover:brightness-110 active:brightness-95',
        line: 'border border-[rgba(219,231,240,0.16)] bg-[rgba(219,231,240,0.04)] text-[var(--fg)] hover:border-[rgba(219,231,240,0.4)] hover:bg-[rgba(219,231,240,0.08)]',
        ghost: 'border border-[#2A3366] text-white bg-transparent hover:border-[#666] hover:bg-[rgba(219,231,240,0.05)]',
        link: 'border-0 border-b border-current rounded-none bg-transparent p-0 text-[var(--fg)] hover:text-white pb-0.5 font-medium',
      },
      size: {
        sm: 'px-3.5 py-2 text-[13.5px]',
        md: 'px-6 py-3.5 text-[14.5px] tracking-[-0.005em]',
        lg: 'px-8 py-4 text-[16px]',
        icon: 'w-10 h-10 p-0 rounded-full',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'dark',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
