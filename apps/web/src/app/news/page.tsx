import React from 'react';
import type { Metadata } from 'next';
import { NEWS_CATEGORIES, type CommunityNews } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { getItems, getSettings } from '../../lib/community-store';
import { formatDisplayDate, generatedGradient, isoDate, mergeCategories, safeUrl, sortByDateDesc } from '../../lib/content';
import { PageHero, Section } from '../../components/content/ui';
import { NewsBrowser, type NewsCardData } from '../../components/content/NewsBrowser';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'News & Updates',
    description: `Community announcements, event announcements, professional updates, member achievements and partnerships from ${siteName}.`,
    alternates: { canonical: '/news' },
  };
}

export default function NewsPage() {
  const news = sortByDateDesc(getItems<CommunityNews>('news', true));
  const items: NewsCardData[] = news.map((n) => ({
    slug: n.slug,
    title: n.title,
    category: n.category,
    dateLabel: formatDisplayDate(n.date),
    dateIso: isoDate(n.date),
    author: n.author,
    summary: n.summary,
    image: safeUrl(n.coverImageUrl),
    gradient: generatedGradient(n.slug),
  }));

  return (
    <>
      <PageHero
        eyebrow="News & updates"
        eyebrowTone="blue"
        title="What’s"
        accent="new."
        lead="Announcements, professional updates, partnerships and member wins — straight from the community."
        ghost="NEWS"
      />
      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          <NewsBrowser items={items} categories={mergeCategories(NEWS_CATEGORIES, news)} />
        </Container>
      </Section>
    </>
  );
}
