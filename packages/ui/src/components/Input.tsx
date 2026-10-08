import React from 'react';
import { cn } from '../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, mono, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="field">
        {label && (
          <label htmlFor={inputId}>
            {label}
          </label>
        )}
        <div className={cn('relative w-full', icon && 'search')}>
          {icon && (
            <span className="ico">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'inp',
              icon && '!pl-[42px]',
              mono && 'mono',
              error && '!border-[var(--bad)] !shadow-[0_0_0_3px_rgba(255,154,163,0.2)]',
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[12px] text-[var(--bad)] mt-0.5">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
