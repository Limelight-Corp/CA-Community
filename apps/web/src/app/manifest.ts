import type { MetadataRoute } from 'next';
import { DEFAULT_DARK_TOKENS } from '@ascend/shared';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EAGLE 2.0 CA Community',
    short_name: 'EAGLE 2.0',
    description:
      'A professional community for Chartered Accountants, CA students and allied professionals. Learn, connect, grow and contribute.',
    start_url: '/',
    display: 'standalone',
    background_color: DEFAULT_DARK_TOKENS.bg,
    theme_color: DEFAULT_DARK_TOKENS.bg,
    orientation: 'portrait-primary',
    categories: ['business', 'finance', 'education'],
    icons: [
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Annual Summit 2026',
        short_name: 'Summit',
        url: '/events/annual-summit-2026',
        description: 'View Annual Summit schedule and speakers',
      },
      {
        name: 'Events Calendar',
        short_name: 'Events',
        url: '/events',
        description: 'Browse upcoming CA masterclasses and meetups',
      },
      {
        name: 'Member Digital Pass',
        short_name: 'My Pass',
        url: '/dashboard',
        description: 'Access offline event QR code passes',
      },
      {
        name: 'CA Member Directory',
        short_name: 'Directory',
        url: '/directory',
        description: 'Members-only directory of fellow members',
      },
    ],
  };
}
