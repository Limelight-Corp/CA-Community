/**
 * Security headers for the admin console (checklist §23). Stricter than the website: no third
 * parties except video previews, never framed, and camera allowed only for the check-in scanner.
 */
import { fileURLToPath } from 'node:url';
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self'",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Prisma (via @ascend/db) loads its query engine at runtime, so it must not be bundled.
  serverExternalPackages: ['@ascend/db'],
  // Monorepo: trace files from the repo root, and ship Prisma's generated client (query engine
  // binary + schema) with every server function — Vercel would otherwise leave it out.
  outputFileTracingRoot: fileURLToPath(new URL('../../', import.meta.url)),
  outputFileTracingIncludes: { '/**/*': ['../../packages/db/generated/client/**/*'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
