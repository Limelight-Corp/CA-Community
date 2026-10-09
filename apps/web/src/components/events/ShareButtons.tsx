'use client';

import React, { useEffect, useState } from 'react';
import { Check, Link2, MessageCircle, Share2 } from 'lucide-react';
import { cn, useToast } from '@ascend/ui';
import { SocialIcon } from '../site/SocialIcon';

export interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

/** LinkedIn, X, Facebook, WhatsApp and copy-link sharing for an event. */
export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => setCanNativeShare(typeof navigator.share === 'function'), []);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { key: 'linkedin', label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { key: 'x', label: 'X', href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: 'facebook', label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}` },
  ] as const;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast('Event link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy — please copy the address bar link');
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      /* cancelled */
    }
  };

  const btn =
    'grid h-11 w-11 place-items-center rounded-full border border-mist/[0.14] text-[var(--fg)] transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:bg-brand-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {links.map((l) => (
        <a
          key={l.key}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className={btn}
          aria-label={`Share on ${l.label} (opens in a new tab)`}
        >
          {l.key === 'whatsapp' ? (
            <MessageCircle className="h-[18px] w-[18px]" aria-hidden />
          ) : (
            <SocialIcon name={l.key} className="h-[18px] w-[18px]" />
          )}
        </a>
      ))}
      <button type="button" onClick={copy} className={btn} aria-label="Copy event link">
        {copied ? <Check className="h-[18px] w-[18px] text-ok" aria-hidden /> : <Link2 className="h-[18px] w-[18px]" aria-hidden />}
      </button>
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={cn(btn, 'sm:hidden')} aria-label="Share via your device">
          <Share2 className="h-[18px] w-[18px]" aria-hidden />
        </button>
      )}
    </div>
  );
}
