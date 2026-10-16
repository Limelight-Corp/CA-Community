import React from 'react';
import type { Metadata } from 'next';
import type { CommunityNews } from '@ascend/shared';
import { NEWS_PAGE_CONTENT } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { Newspaper } from 'lucide-react';
import { getItems } from '../../lib/community-store';
import { formatDisplayDate, generatedGradient, isoDate, safeUrl, sortByDateDesc } from '../../lib/content';
import { PageHero, Section } from '../../components/content/ui';
import { NewsBrowser, type NewsCardData } from '../../components/content/NewsBrowser';
import { siteTaxonomy } from '../../lib/taxonomy';

export async function generateMetadata(): Promise<Metadata> {
  const title = NEWS_PAGE_CONTENT.seoTitle;
  const description =
    'Stay informed about EAGLE 2.0 announcements, community initiatives, professional updates, upcoming events and member achievements.';
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/news' },
    openGraph: { title, description, url: '/news' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function NewsPage() {
  const news = sortByDateDesc(await getItems<CommunityNews>('news', true));
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
        eyebrow={NEWS_PAGE_CONTENT.hero.eyebrow}
        eyebrowTone="blue"
        title="What's New at"
        accent="EAGLE 2.0."
        lead={
          <div className="space-y-3 text-pretty">
            {NEWS_PAGE_CONTENT.hero.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
            <p className="pt-2 font-display text-[17px] font-medium tracking-tight text-gold-soft">
              {NEWS_PAGE_CONTENT.tagline}
            </p>
          </div>
        }
        ghost="NEWS"
      />

      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          {/* Blueprint §8.3: What's Covered in News & Updates */}
          <div className="mb-10 rounded-[28px] border border-mist/[0.1] bg-grad-surface p-6 md:p-8">
            <div className="mb-5 flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-300">
                Community Updates & News Scope
              </span>
              <h2 className="font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--fg)]">
                Key Areas of Focus
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {NEWS_PAGE_CONTENT.scopeHighlights.map((scope, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-[18px] border border-mist/[0.08] bg-white/[0.02] p-3.5 transition hover:border-gold/30 hover:bg-gold/[0.03]"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-300">
                    <Newspaper className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="text-[14px] font-medium text-[var(--fg)]">
                    {scope}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <NewsBrowser items={items} categories={await siteTaxonomy('newsCategories', news.map((n) => n.category))} />
        </Container>
      </Section>
    </>
  );
}
