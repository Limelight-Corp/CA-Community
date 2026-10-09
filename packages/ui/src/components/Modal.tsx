'use client';

import React, { useEffect } from 'react';
import { XIcon } from './icons';
import { cn } from '../utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
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

  const maxWidthClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full max-h-[92dvh] sm:max-h-[88vh] flex flex-col bg-[var(--card)] border border-[var(--line)] rounded-xl sm:rounded-2xl text-[var(--fg)] shadow-2xl relative animate-in zoom-in-95 duration-200 overflow-hidden my-auto',
          maxWidthClass,
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 z-20 p-1.5 text-[var(--muted)] hover:text-white bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <XIcon size={18} />
        </button>

        {(title || description) && (
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 pr-12 border-b border-[var(--line)] bg-[rgba(255,255,255,0.02)] flex-shrink-0">
            {title && (
              <h3 className="font-display text-lg sm:text-xl md:text-2xl font-medium tracking-tight text-[var(--fg)]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-[13.5px] text-[var(--muted)] mt-1 sm:mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
};
