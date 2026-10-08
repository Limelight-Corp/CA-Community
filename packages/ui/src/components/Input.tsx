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
      <div className="flex flex-col gap-2 min-w-0 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] text-[var(--muted)] select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-3.5 text-[var(--muted)] pointer-events-none flex items-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full py-3.2 px-4 rounded-[14px] border border-[rgba(219,231,240,0.12)] bg-[var(--card)] text-[var(--fg)] text-[14.5px] transition-all outline-none min-w-0',
              'focus:border-[var(--lime)] focus:ring-2 focus:ring-[rgba(47,91,255,0.25)]',
              'placeholder:text-[var(--faint)]',
              icon && 'pl-11',
              mono && 'font-mono tabular-nums',
              error && 'border-[var(--bad)] focus:border-[var(--bad)] focus:ring-[rgba(255,154,163,0.2)]',
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
