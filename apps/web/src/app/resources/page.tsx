import React from 'react';
import type { Metadata } from 'next';
import { RESOURCE_CATEGORIES, type CommunityResource } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { getItems, getSettings } from '../../lib/community-store';
import { mergeCategories, safeUrl } from '../../lib/content';
import { CtaBand, PageHero, Section } from '../../components/content/ui';
import { ResourceLibrary, type ResourceCardData } from '../../components/content/ResourceLibrary';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = getSettings();
  return {
    title: 'Resources',
    description: `Knowledge library from ${siteName}: articles, guides, career resources, tax updates, finance and practice resources, webinars, videos and downloadable PDFs.`,
    alternates: { canonical: '/resources' },
  };
}

export default function ResourcesPage() {
  const resources = getItems<CommunityResource>('resources', true);
  const items: ResourceCardData[] = resources.map((r) => {
    // Members-only file links are withheld from the public page entirely.
    const fileUrl = r.isMembersOnly ? undefined : safeUrl(r.fileUrl);
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      format: r.format,
      isMembersOnly: r.isMembersOnly,
      fileUrl,
      isDownload: !!fileUrl && /\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|$)/i.test(fileUrl),
    };
  });

  return (
    <>
      <PageHero
        eyebrow="Knowledge library"
        eyebrowTone="blue"
        title="Read. Watch."
        accent="Level up."
        lead="Guides, tax updates, career resources, webinars and downloads curated by the wings. Some resources are reserved for members."
        ghost="LIBRARY"
      />
      <Section className="pt-12 md:pt-16">
        <Container size="wide">
          <ResourceLibrary items={items} categories={mergeCategories(RESOURCE_CATEGORIES, resources)} />
        </Container>
      </Section>
      <CtaBand
        title="Unlock the"
        accent="full library."
        lead="Members get access to member-only resources, discussions and discounts on paid events."
        primary={{ href: '/join', label: 'Become a member' }}
      />
    </>
  );
}
