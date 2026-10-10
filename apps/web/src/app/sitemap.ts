import type { MetadataRoute } from 'next';
import type { CommunityEvent, CommunityNews, CommunitySpeaker } from '@ascend/shared';
import { getItems } from '../lib/community-store';
import { siteUrl } from '../lib/seo';
import { isoDate } from '../lib/content';
import { LEGAL_DOCS } from '../components/content/legal-docs';
import { allWingHubs } from '../lib/wings';
import { openJobs } from '../lib/jobs';

// Content changes in the admin at any time, so build the sitemap on each request.
export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { path: '/', priority: 1, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/events', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/wings', priority: 0.8, changeFrequency: 'weekly' as const },
    ...allWingHubs().map((w) => ({ path: `/wings/${w.slug}`, priority: 0.7, changeFrequency: 'weekly' as const })),
    { path: '/speakers', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/resources', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/news', priority: 0.7, changeFrequency: 'daily' as const },
    { path: '/gallery', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: '/careers', priority: 0.7, changeFrequency: 'daily' as const },
    ...openJobs().map((j) => ({ path: `/careers/${j.slug}`, priority: 0.6, changeFrequency: 'weekly' as const })),
    { path: '/join', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/legal', priority: 0.2, changeFrequency: 'yearly' as const },
    ...LEGAL_DOCS.map((d) => ({ path: `/legal/${d.slug}`, priority: 0.2, changeFrequency: 'yearly' as const })),
  ].map(({ path, priority, changeFrequency }) => ({ url: `${base}${path}`, lastModified: now, changeFrequency, priority }));

  const lastMod = (item: { updatedAt?: string; createdAt?: string }, fallback?: string) => {
    const d = item.updatedAt || item.createdAt || fallback;
    const t = d ? Date.parse(d) : NaN;
    return Number.isNaN(t) ? now : new Date(t);
  };

  const events = getItems<CommunityEvent>('events', true).map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: lastMod(e),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  const news = getItems<CommunityNews>('news', true).map((n) => ({
    url: `${base}/news/${n.slug}`,
    lastModified: lastMod(n, isoDate(n.date)),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  const speakers = getItems<CommunitySpeaker>('speakers', true).map((s) => ({
    url: `${base}/speakers/${s.slug}`,
    lastModified: lastMod(s),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...events, ...news, ...speakers];
}
