import React from 'react';
import { cn } from '../utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-2 min-w-0 w-full">
        {label && (
          <label htmlFor={selectId} className="text-[13px] text-[var(--muted)] select-none">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full py-3.2 px-4 rounded-[14px] border border-[rgb(var(--mist-rgb)/0.12)] bg-[var(--card)] text-[var(--fg)] text-[14.5px] outline-none min-w-0 appearance-none cursor-pointer',
            'focus:border-[var(--lime)] focus:ring-2 focus:ring-[rgb(var(--lime-rgb)/0.25)]',
            error && 'border-[var(--bad)]',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[var(--card)] text-[var(--fg)]">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-[12px] text-[var(--bad)] mt-0.5">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
