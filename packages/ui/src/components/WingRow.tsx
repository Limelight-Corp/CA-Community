'use client';

import React from 'react';
import { PlusIcon, MinusIcon } from './icons';
import { cn } from '../utils';

export interface WingRowProps {
  number: number;
  name: string;
  color: string;
  tags: string;
  activities: string[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const WingRow: React.FC<WingRowProps> = ({
  number,
  name,
  color,
  tags,
  activities,
  isOpen,
  onToggle,
  className,
}) => {
  return (
    <div className={cn('border-b border-[var(--line)]', className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'w-full py-5.5 bg-transparent border-0 text-left cursor-pointer transition-colors',
          'grid grid-cols-[40px_minmax(0,1fr)_20px] md:grid-cols-[56px_minmax(0,1fr)_minmax(0,1.2fr)_24px] gap-6 items-center group'
        )}
      >
        {/* Number */}
        <span className="font-mono text-[13px] text-[var(--muted)]">
          {String(number).padStart(2, '0')}
        </span>

        {/* Title & Dot */}
        <h3 className="font-display text-[18px] md:text-[22px] font-medium tracking-[-0.02em] text-[var(--fg)] flex items-center gap-3 transition-colors group-hover:text-[var(--lime-deep)]">
          <i
            className="w-2 h-2 rounded-full flex-none"
            style={{ backgroundColor: color }}
          />
          {name}
        </h3>

        {/* Tags (Desktop only) */}
        <p className="text-[14px] text-[var(--muted)] hidden md:block truncate">
          {tags}
        </p>

        {/* Expand/Collapse Toggle */}
        <span className="text-[var(--muted)] flex justify-end">
          {isOpen ? <MinusIcon size={18} /> : <PlusIcon size={18} />}
        </span>
      </button>

      {/* Activities Panel */}
      {isOpen && (
        <div className="pb-7 pl-10 md:pl-20 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[14.5px] text-[var(--muted)] animate-in fade-in duration-200">
          {activities.map((act, idx) => (
            <span key={idx} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--faint)]" />
              {act}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
