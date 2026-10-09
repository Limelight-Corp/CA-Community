import type { Metadata } from 'next';
import { Inter, Inter_Tight } from 'next/font/google';
import { generateThemeCssVariables } from '@ascend/ui';
import { DEFAULT_DARK_TOKENS } from '@ascend/shared';
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

export const metadata: Metadata = {
  title: { default: 'ASCEND Admin', template: '%s · ASCEND Admin' },
  description: 'Content, events, registrations and membership management for the ASCEND CA community website.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeCss = generateThemeCssVariables(DEFAULT_DARK_TOKENS);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable}`}
      data-theme="dark"
    >
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <style
          id="ascend-admin-theme"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans antialiased selection:bg-[var(--lime)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
