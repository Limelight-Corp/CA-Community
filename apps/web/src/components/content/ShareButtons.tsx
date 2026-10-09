'use client';

import React, { useState } from 'react';
import { Check, Facebook, Link2, Linkedin, MessageCircle } from 'lucide-react';

/** Social sharing for an article (LinkedIn, X, Facebook, WhatsApp, copy link). */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const targets = [
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <Linkedin className="h-4 w-4" aria-hidden /> },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <Facebook className="h-4 w-4" aria-hidden /> },
    { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${u}`, icon: <MessageCircle className="h-4 w-4" aria-hidden /> },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt('Copy this link', url);
    }
  }

  const btn =
    'inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.14] px-4 text-[13px] font-medium text-[var(--fg)] transition hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300';

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Share</span>
      <ul className="flex flex-wrap gap-2">
        {targets.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noopener noreferrer" className={btn} aria-label={`Share on ${s.label}`}>
              {s.icon}
              <span>{s.label}</span>
            </a>
          </li>
        ))}
        <li>
          <button type="button" onClick={copy} className={btn}>
            {copied ? <Check className="h-4 w-4 text-ok" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
        </li>
      </ul>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}
