import React from 'react';
import type { Metadata } from 'next';
import type { CommunityGalleryItem } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { getItems, getSettings } from '../../lib/community-store';
import { generatedGradient, safeUrl, videoEmbedUrl } from '../../lib/content';
import { PageHero, Section } from '../../components/content/ui';
import { GalleryGrid, type GalleryCardData } from '../../components/content/GalleryGrid';
import { siteTaxonomy } from '../../lib/taxonomy';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Gallery',
    description: `Photos and videos from ${siteName} events, conferences, networking sessions, workshops and community activities.`,
    alternates: { canonical: '/gallery' },
  };
}

export default function GalleryPage() {
  const gallery = getItems<CommunityGalleryItem>('gallery', true);
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
        eyebrow="Gallery"
        eyebrowTone="blue"
        title="Moments that"
        accent="moved us."
        lead="Conferences, workshops, networking nights and community days — the energy, captured."
        ghost="FRAMES"
      />
      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          <GalleryGrid items={items} categories={siteTaxonomy('galleryCategories', gallery.map((g) => g.category))} />
        </Container>
      </Section>
    </>
  );
}
