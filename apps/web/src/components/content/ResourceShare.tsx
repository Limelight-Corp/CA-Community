'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Facebook, Link2, Linkedin, MessageCircle, Share2 } from 'lucide-react';

/**
 * Compact share control for a resource card: the phone's share sheet where available,
 * otherwise a small menu (LinkedIn, WhatsApp, X, Facebook, copy link).
 */
export function ResourceShare({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  /** Screen position of the menu: cards clip their content, so the menu is `fixed`. */
  const [pos, setPos] = useState<React.CSSProperties>({});
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const url = () => `${window.location.origin}/resources#resource-${encodeURIComponent(id)}`;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
        return;
      }
      const t = e.target as Node;
      if (!box.current?.contains(t) && !menu.current?.contains(t)) setOpen(false);
    };
    const dismiss = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('scroll', dismiss, { passive: true });
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('scroll', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);

  const share = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await nav.share({ title, url: url() });
        return;
      } catch {
        /* cancelled — fall back to the menu */
      }
    }
    const r = trigger.current?.getBoundingClientRect();
    if (r) {
      const MENU_H = 232;
      const above = r.top > MENU_H + 16;
      setPos({
        position: 'fixed',
        right: Math.max(8, window.innerWidth - r.right),
        ...(above ? { bottom: window.innerHeight - r.top + 8 } : { top: r.bottom + 8 }),
      });
    }
    setOpen((o) => !o);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link', url());
    }
  };

  const item =
    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] text-[var(--fg)] transition hover:bg-mist/[0.08]';
  const links = () => {
    const u = encodeURIComponent(url());
    const t = encodeURIComponent(title);
    return [
      {
        label: 'LinkedIn',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
        icon: <Linkedin className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'WhatsApp',
        href: `https://wa.me/?text=${t}%20${u}`,
        icon: <MessageCircle className="h-4 w-4" aria-hidden />,
      },
      {
        label: 'X',
        href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
        icon: (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        ),
      },
      {
        label: 'Facebook',
        href: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
        icon: <Facebook className="h-4 w-4" aria-hidden />,
      },
    ];
  };

  return (
    <div ref={box} className="relative z-20">
      <button
        ref={trigger}
        type="button"
        onClick={share}
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid h-9 w-9 place-items-center rounded-full border border-mist/[0.14] text-[var(--muted)] transition hover:border-gold/60 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        <span className="sr-only">Share {title}</span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={`Share ${title}`}
            style={pos}
            className="z-[80] w-48 rounded-2xl border border-mist/[0.14] bg-bg/95 p-1.5 shadow-[0_20px_50px_-20px_rgb(var(--black-rgb)/0.9)] backdrop-blur-xl"
          >
            {links().map((l) => (
              <a
                key={l.label}
                role="menuitem"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={item}
                onClick={() => setOpen(false)}
              >
                {l.icon}
                {l.label}
              </a>
            ))}
            <button type="button" role="menuitem" onClick={copy} className={item}>
              {copied ? (
                <Check className="h-4 w-4 text-ok" aria-hidden />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden />
              )}
              {copied ? 'Link copied' : 'Copy link'}
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
