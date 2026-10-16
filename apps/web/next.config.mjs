/**
 * Security headers for the public website (checklist §23).
 *
 * The Content-Security-Policy allows only the third parties the site actually uses:
 * Razorpay Checkout, Google Fonts, Google Analytics / Tag Manager, Meta Pixel (only loaded after cookie
 * consent), Cloudflare Turnstile, Google Maps embeds and YouTube / Vimeo videos.
 * Images may come from any https URL because CMS editors can paste external image links.
 * Add a domain here before embedding anything new.
 */
import { fileURLToPath } from 'node:url';
import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';
// next dev evaluates modules with eval() (React Refresh); production never needs it.
const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devEval} https://*.razorpay.com https://www.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.razorpay.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://challenges.cloudflare.com",
  "frame-src https://*.razorpay.com https://www.google.com https://maps.google.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com",
  "media-src 'self' https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com",
  "frame-ancestors 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Payments may use the Payment Request API; nothing on the site needs camera, mic or location.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com")' },
  // Browsers only honour HSTS over HTTPS, so this is harmless on http://localhost.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Prisma (via @ascend/db) loads its query engine at runtime, so it must not be bundled.
  serverExternalPackages: ['@ascend/db'],
  // Monorepo: trace files from the repo root, and ship Prisma's generated client (query engine
  // binary + schema) with every server function — Vercel would otherwise leave it out.
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  // copy-engine.mjs (prebuild) puts the engine in ./.prisma/client, a folder Prisma always searches.
  outputFileTracingIncludes: { '/**/*': ['./.prisma/client/**/*', '../../packages/db/generated/client/**/*'] },
  // Next bundles @ascend/db, so Prisma looks for its engine next to the server bundle (.next/server).
  // Prisma's monorepo plugin copies the engine + schema there at build time.
  webpack(config, { isServer }) {
    if (isServer) config.plugins.push(new PrismaPlugin());
    return config;
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/join-us', destination: '/join', permanent: true },
    ];
  },
};

export default nextConfig;
