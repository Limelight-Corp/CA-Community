'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

/**
 * Cookie consent (checklist §24). Essential cookies (sign-in session, security) are always on;
 * analytics / marketing cookies are only set after the visitor chooses "Accept all".
 * The choice is stored for a year in the `ascend_consent` cookie ("all" | "essential").
 */

export type Consent = 'all' | 'essential' | null;
const COOKIE = 'ascend_consent';
const CHANGE = 'ascend:consent-change';
const OPEN = 'ascend:cookie-settings';

function read(): Consent {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)ascend_consent=(all|essential)/);
  return (m?.[1] as Consent) ?? null;
}

function write(value: 'all' | 'essential') {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CHANGE));
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE, cb);
  return () => window.removeEventListener(CHANGE, cb);
}

/** The visitor's current choice (null until they choose). */
export function useConsent(): Consent {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Re-opens the banner, e.g. from the "Cookie settings" footer link. */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN));
}

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}

export function CookieConsent({ enabled }: { enabled: boolean }) {
  const consent = useConsent();
  const [reopened, setReopened] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const open = () => setReopened(true);
    window.addEventListener(OPEN, open);
    return () => window.removeEventListener(OPEN, open);
  }, []);

  if (!mounted || (!reopened && (consent || !enabled))) return null;

  const choose = (v: 'all' | 'essential') => {
    write(v);
    setReopened(false);
    // Turning analytics off needs a reload to unload scripts that already ran.
    if (v === 'essential' && consent === 'all') window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-[90] mx-auto max-w-[680px] rounded-[24px] border border-mist/[0.14] bg-bg/95 p-5 shadow-[0_30px_80px_-30px_rgb(var(--black-rgb)/0.9)] backdrop-blur-xl sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold sm:grid">
          <Cookie className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[18px] font-medium tracking-[-0.02em] text-[var(--fg)]">
            Cookies on this site
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--muted)]">
            We use essential cookies to keep you signed in and the site secure.
            {enabled
              ? ' With your permission we also use analytics cookies to understand how the site is used and improve it.'
              : ' This site currently uses no analytics or advertising cookies.'}{' '}
            <Link href="/legal/cookies" className="text-[var(--fg)] underline underline-offset-2">
              Cookie Policy
            </Link>
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {enabled && (
              <button
                type="button"
                onClick={() => choose('all')}
                className="inline-flex h-11 items-center justify-center rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white"
              >
                Accept all
              </button>
            )}
            <button
              type="button"
              onClick={() => choose('essential')}
              className="inline-flex h-11 items-center justify-center rounded-full border border-mist/[0.18] px-5 text-[14px] font-semibold text-[var(--fg)] hover:border-mist/40"
            >
              {enabled ? 'Essential only' : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
