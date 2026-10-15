import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, Instrument_Serif } from 'next/font/google';
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

export const metadata: Metadata = {
  title: { default: 'ASCEND Admin', template: '%s · ASCEND Admin' },
  description: 'Content, events, registrations and membership management for the ASCEND CA community website.',
  icons: {
    icon: [
      { url: '/brand/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/brand/apple-icon.png',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#FAF7F2',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable}`}
      data-theme="light"
    >
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans antialiased selection:bg-[var(--lime)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
