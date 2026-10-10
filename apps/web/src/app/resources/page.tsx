import React from 'react';
import type { Metadata } from 'next';
import type { CommunityResource } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { getItems, getSettings } from '../../lib/community-store';
import { resourceDownloadUrl, safeUrl } from '../../lib/content';
import { CtaBand, PageHero, Section } from '../../components/content/ui';
import { ResourceLibrary, type ResourceCardData } from '../../components/content/ResourceLibrary';
import { siteTaxonomy } from '../../lib/taxonomy';

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
    // Links always go through the download route, which checks members-only access;
    // the stored file path or external link is never sent to the browser.
    const stored = safeUrl(r.fileUrl);
    const fileUrl = stored ? resourceDownloadUrl(r.id) : undefined;
    return {
      id: r.id,
      title: r.title,
      category: r.category,
      format: r.format,
      isMembersOnly: r.isMembersOnly,
      fileUrl,
      isDownload: !!stored && /\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|$)/i.test(stored),
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
          <ResourceLibrary items={items} categories={siteTaxonomy('resourceCategories', resources.map((r) => r.category))} />
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
