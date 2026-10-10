'use client';

import React, { createContext, useContext } from 'react';
import Script from 'next/script';
import { ToastProvider } from '@ascend/ui';
import { PwaRegister } from '../PwaRegister';
import { CookieConsent, useConsent } from './CookieConsent';

/** Runtime site configuration the server hands to client components. */
export interface SiteConfig {
  /** Cloudflare Turnstile site key — when set, public forms show the CAPTCHA. */
  turnstileSiteKey?: string;
}
const SiteConfigContext = createContext<SiteConfig>({});
export const useSiteConfig = () => useContext(SiteConfigContext);

/**
 * Client-side providers shared by every page: toasts, PWA registration, cookie consent and
 * analytics. Google Analytics and Meta Pixel load only after the visitor accepts analytics
 * cookies (checklist §24/§25); with neither configured, no banner is shown at all.
 */
export function Providers({
  children,
  gaId,
  metaPixelId,
  config = {},
}: {
  children: React.ReactNode;
  gaId?: string;
  metaPixelId?: string;
  config?: SiteConfig;
}) {
  const ga = gaId && /^G-[A-Z0-9]+$/.test(gaId) ? gaId : undefined;
  const pixel = metaPixelId && /^\d{5,20}$/.test(metaPixelId) ? metaPixelId : undefined;
  return (
    <SiteConfigContext.Provider value={config}>
      <ToastProvider>
        {children}
        <PwaRegister />
        <CookieConsent enabled={!!(ga || pixel)} />
        <Trackers gaId={ga} metaPixelId={pixel} />
      </ToastProvider>
    </SiteConfigContext.Provider>
  );
}

function Trackers({ gaId, metaPixelId }: { gaId?: string; metaPixelId?: string }) {
  const consent = useConsent();
  if (consent !== 'all') return null;
  return (
    <>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
      {metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

/** Meta Pixel standard events for our conversion names (anything else is sent as custom). */
const PIXEL_EVENTS: Record<string, string> = {
  begin_registration: 'InitiateCheckout',
  registration_complete: 'CompleteRegistration',
  payment_success: 'Purchase',
};

/** Sends a conversion event to GA4 / Meta Pixel — only if they were loaded (i.e. consent given). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void };
  w.gtag?.('event', name, params);
  if (w.fbq) {
    const std = PIXEL_EVENTS[name];
    const value = typeof params.value === 'number' ? params.value : undefined;
    const data = value !== undefined ? { value, currency: params.currency ?? 'INR' } : {};
    if (std) w.fbq('track', std, data);
    else w.fbq('trackCustom', name, params);
  }
}
