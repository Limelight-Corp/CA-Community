import React from 'react';
import type { Metadata } from 'next';
import type { CommunityGalleryItem } from '@ascend/shared';
import { GALLERY_PAGE_CONTENT } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { getItems } from '../../lib/community-store';
import { generatedGradient, safeUrl, videoEmbedUrl } from '../../lib/content';
import { /* CtaBand, */ PageHero, Section } from '../../components/content/ui';
import { GalleryGrid, type GalleryCardData } from '../../components/content/GalleryGrid';
import { siteTaxonomy } from '../../lib/taxonomy';

export async function generateMetadata(): Promise<Metadata> {
  const title = GALLERY_PAGE_CONTENT.seoTitle;
  const description =
    'Explore photographs and highlights from EAGLE 2.0 events, professional workshops, networking sessions and community initiatives.';
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/gallery' },
    openGraph: { title, description, url: '/gallery' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function GalleryPage() {
  const gallery = await getItems<CommunityGalleryItem>('gallery', true);
  const items: GalleryCardData[] = gallery.map((g) => {
    const embedUrl = videoEmbedUrl(g.videoUrl) ?? undefined;
    return {
      id: g.id,
      title: g.title,
      category: g.category,
      date: g.date,
      location: g.location,
      image: safeUrl(g.imageUrl),
      embedUrl,
      videoUrl: embedUrl ? undefined : safeUrl(g.videoUrl),
      gradient: generatedGradient(g.id + g.title),
    };
  });

  return (
    <>
      <PageHero
        eyebrow={GALLERY_PAGE_CONTENT.hero.eyebrow}
        eyebrowTone="blue"
        title={GALLERY_PAGE_CONTENT.hero.title}
        accent={GALLERY_PAGE_CONTENT.hero.accent}
        lead={
          <div className="space-y-3 text-pretty">
            {GALLERY_PAGE_CONTENT.hero.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
            <p className="pt-2 font-display text-[17px] font-medium tracking-tight text-gold-soft">
              {GALLERY_PAGE_CONTENT.hero.tagline}
            </p>
          </div>
        }
        ghost="GALLERY"
      />

      <Section className="pt-6 pb-10 md:pt-8 md:pb-14">
        <Container size="wide">
          <GalleryGrid items={items} categories={await siteTaxonomy('galleryCategories', gallery.map((g) => g.category))} />
        </Container>
      </Section>

      {/* ---------------------------------------------------------------- Preserved - Gallery Closing CTA Band
      <CtaBand
        align="center"
        title={GALLERY_PAGE_CONTENT.banner.heading}
        accent={GALLERY_PAGE_CONTENT.banner.accent}
        lead={GALLERY_PAGE_CONTENT.banner.lead}
        primary={GALLERY_PAGE_CONTENT.banner.ctaPrimary}
        secondary={GALLERY_PAGE_CONTENT.banner.ctaSecondary}
      />
      ---------------------------------------------------------------- */}
    </>
  );
}
