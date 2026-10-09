'use client';

import React from 'react';
import Script from 'next/script';
import { ToastProvider } from '@ascend/ui';
import { PwaRegister } from '../PwaRegister';

/** Client-side providers shared by every page: toasts, PWA registration and analytics. */
export function Providers({ children, gaId }: { children: React.ReactNode; gaId?: string }) {
  return (
    <ToastProvider>
      {children}
      <PwaRegister />
      {gaId && /^G-[A-Z0-9]+$/.test(gaId) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
    </ToastProvider>
  );
}

/** Sends a GA4 event when analytics is configured (checklist §25 conversion tracking). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', name, params);
}
