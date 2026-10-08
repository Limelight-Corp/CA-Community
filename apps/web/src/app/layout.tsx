import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, Instrument_Serif } from 'next/font/google';
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

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ASCEND CA Community — Where young CAs rise together',
  description:
    'A Pan-India community for Chartered Accountants, corporate finance leaders and students. Ten professional wings, events, and a network that grows with your career.',
};

export const viewport: Viewport = {
  themeColor: '#03050F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeCss = generateThemeCssVariables(DEFAULT_DARK_TOKENS);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${instrumentSerif.variable}`}
      data-theme="dark"
    >
      <head>
        <style
          id="ascend-ssr-theme"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--fg)] font-sans antialiased selection:bg-[var(--lime)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
