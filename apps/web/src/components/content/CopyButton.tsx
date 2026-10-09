'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@ascend/ui';

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard unavailable — the value is still visible to copy manually */
        }
      }}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition',
        copied ? 'border-ok/40 bg-ok/10 text-ok' : 'border-mist/[0.16] text-[var(--fg)] hover:border-gold/50 hover:text-gold',
        className
      )}
      aria-live="polite"
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  );
}
