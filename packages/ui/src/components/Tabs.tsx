import React from 'react';
import { cn } from '../utils';

export interface TabOption<T extends string = string> {
  id: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex border border-[rgb(var(--mist-rgb)/0.16)] rounded-full p-[3px] gap-[2px] bg-[rgb(var(--mist-rgb)/0.02)]',
        fullWidth && 'w-full',
        className
      )}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-full transition-all duration-150 cursor-pointer text-center select-none whitespace-nowrap',
              size === 'sm' ? 'py-1 px-2.5 text-[12px]' : 'py-1.5 px-3.5 text-[13px]',
              fullWidth && 'flex-1',
              isSelected
                ? 'bg-[var(--lime)] text-white shadow-[0_6px_16px_-8px_rgb(var(--lime-rgb)/0.9)] font-medium'
                : 'bg-transparent text-[var(--fg)] hover:text-white'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
