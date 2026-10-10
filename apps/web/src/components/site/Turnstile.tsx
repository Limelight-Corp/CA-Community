'use client';

import React, { useEffect, useRef } from 'react';
import { useSiteConfig } from './Providers';

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
    __turnstileLoading?: Promise<void>;
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!window.__turnstileLoading) {
    window.__turnstileLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Turnstile failed to load'));
      document.head.appendChild(s);
    });
  }
  return window.__turnstileLoading;
}

/** True when the CAPTCHA is switched on for this site. */
export function useCaptchaEnabled(): boolean {
  return !!useSiteConfig().turnstileSiteKey;
}

/**
 * Cloudflare Turnstile widget. Renders nothing unless TURNSTILE_* keys are configured.
 * Tokens are single-use: bump `resetKey` after every submit attempt to get a fresh one.
 */
export function Turnstile({ onToken, resetKey = 0, className }: { onToken: (token: string) => void; resetKey?: number; className?: string }) {
  const siteKey = useSiteConfig().turnstileSiteKey;
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!siteKey || !box.current) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile || widget.current) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (t: string) => cb.current(t),
          'expired-callback': () => cb.current(''),
          'error-callback': () => cb.current(''),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey && widget.current && window.turnstile) {
      window.turnstile.reset(widget.current);
      cb.current('');
    }
  }, [resetKey]);

  if (!siteKey) return null;
  return <div ref={box} className={className} />;
}
