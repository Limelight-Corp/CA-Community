import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, Instrument_Serif } from 'next/font/google';
import { generateThemeCssVariables } from '@ascend/ui';
import { DEFAULT_DARK_TOKENS } from '@ascend/shared';
import { AuthProvider } from '../context/AuthContext';
import { getSettings } from '../lib/community-store';
import { SiteHeader } from '../components/site/SiteHeader';
import { SiteFooter } from '../components/site/SiteFooter';
import { Providers } from '../components/site/Providers';
import { SupportChat } from '../components/site/SupportChat';
import { jsonLd, siteUrl } from '../lib/seo';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Content is edited live from the admin console, so pages render on request.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = getSettings();
  const title = `${settings.siteName} — ${settings.heroHeadline} ${settings.heroHeadlineAccent}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${settings.siteName}` },
    description: settings.tagline,
    manifest: '/manifest.json',
    icons: { icon: '/icon.svg', apple: '/icon.svg' },
    appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: settings.siteName },
    openGraph: { type: 'website', siteName: settings.siteName, title, description: settings.tagline },
    twitter: { card: 'summary_large_image', title, description: settings.tagline },
    // Google Search Console ownership check (HTML tag method).
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
  };
}

/** Site-wide Organization + WebSite structured data (with the site search action). */
function siteLd(settings: ReturnType<typeof getSettings>) {
  const base = siteUrl();
  const sameAs = Object.values(settings.social ?? {}).filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: settings.siteName,
        url: base,
        logo: `${base}/icon.svg`,
        ...(settings.contact?.email ? { email: settings.contact.email } : {}),
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        name: settings.siteName,
        url: base,
        publisher: { '@id': `${base}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export const viewport: Viewport = {
  themeColor: DEFAULT_DARK_TOKENS.bg,
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeCss = generateThemeCssVariables(DEFAULT_DARK_TOKENS);
  const settings = getSettings();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable}`}
      data-theme="dark"
    >
      <head>
        <style id="ascend-ssr-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(siteLd(settings)) }} />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans antialiased selection:bg-[var(--lime)] selection:text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-brand-950"
        >
          Skip to content
        </a>
        <AuthProvider>
          <Providers gaId={gaId}>
            <SiteHeader siteName={settings.siteName} announcement={settings.announcement} />
            <main id="main" className="relative overflow-x-clip">
              {children}
            </main>
            <SiteFooter settings={settings} />
            <SupportChat />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
