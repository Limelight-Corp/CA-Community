'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../utils';

interface ToastContextType {
  toast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);

  const toast = useCallback((msg: string) => {
    setMessage(msg);
    const timer = setTimeout(() => {
      setMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {message && (
        <div
          role="status"
          className={cn(
            'fixed left-1/2 -translate-x-1/2 bottom-[calc(84px+env(safe-area-inset-bottom,0px))]',
            'bg-[var(--ink)] text-white border border-[var(--line)] py-3 px-5 rounded-[6px] text-[14px]',
            'shadow-xl z-[80] max-w-[90vw] animate-in fade-in slide-in-from-bottom-2 duration-150'
          )}
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
