'use client';

import React, { useEffect } from 'react';
import { XIcon } from './icons';
import { cn } from '../utils';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, className }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-[min(320px,86vw)] h-full bg-[var(--ink)] text-[var(--on-ink)] p-6 pt-10 flex flex-col gap-2 overflow-y-auto animate-in slide-in-from-right duration-250 border-l border-[var(--line)]',
          className
        )}
      >
        <button
          onClick={onClose}
          className="self-end p-2 text-[var(--on-ink-muted)] hover:text-white rounded-md mb-4"
          aria-label="Close navigation drawer"
        >
          <XIcon size={22} />
        </button>
        {children}
      </div>
    </div>
  );
};
