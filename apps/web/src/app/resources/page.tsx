import React from 'react';
import type { Metadata } from 'next';
import type { CommunityResource } from '@ascend/shared';
import { RESOURCES_PAGE_CONTENT } from '@ascend/shared';
import { Container } from '@ascend/ui';
import { getItems } from '../../lib/community-store';
import { resourceDownloadUrl, safeUrl } from '../../lib/content';
import { CtaBand, PageHero, Section } from '../../components/content/ui';
import { ResourceLibrary, type ResourceCardData } from '../../components/content/ResourceLibrary';
import { ResourceCategoryCards } from '../../components/content/ResourceCategoryCards';
import { siteTaxonomy } from '../../lib/taxonomy';

export async function generateMetadata(): Promise<Metadata> {
  const title = RESOURCES_PAGE_CONTENT.seoTitle;
  const description =
    'Explore professional learning resources, tax updates, career guidance, practice insights and technology-related content for the CA community.';
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: '/resources' },
    openGraph: { title, description, url: '/resources' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ResourcesPage() {
  const resources = await getItems<CommunityResource>('resources', true);
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
        eyebrow={RESOURCES_PAGE_CONTENT.hero.eyebrow}
        eyebrowTone="blue"
        title="Knowledge That"
        accent="Moves You Forward."
        className="pb-10 md:pb-14"
        lead={
          <div className="space-y-3 text-pretty">
            {RESOURCES_PAGE_CONTENT.hero.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        }
        ghost="LIBRARY"
      />

      {/* Blueprint §7.3: Explore Resources by Category */}
      <Section className="border-b border-mist/[0.08] pb-10 pt-8 md:pb-14 md:pt-10">
        <Container size="wide">
          <div className="mb-8">
            <h2 className="font-display text-[clamp(26px,4vw,40px)] font-medium tracking-[-0.03em] text-[var(--fg)]">
              {RESOURCES_PAGE_CONTENT.categoriesSection.title}
            </h2>
            <p className="mt-2 text-[15px] text-[var(--muted)]">
              Select a category to explore specialized guides, updates and practical tools.
            </p>
          </div>
          <ResourceCategoryCards />
        </Container>
      </Section>

      {/* Resource Library & Search */}
      <Section className="pt-6 pb-10 md:pt-8 md:pb-14">
        <Container size="wide">
          <ResourceLibrary items={items} categories={await siteTaxonomy('resourceCategories', resources.map((r) => r.category))} />
        </Container>
      </Section>

      {/* Blueprint §7.4: Learn. Apply. Share. */}
      <CtaBand
        align="center"
        title={RESOURCES_PAGE_CONTENT.closingSection.heading}
        accent={RESOURCES_PAGE_CONTENT.closingSection.accent}
        lead={
          <div className="space-y-3">
            {RESOURCES_PAGE_CONTENT.closingSection.paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        }
        primary={{
          href: RESOURCES_PAGE_CONTENT.closingSection.ctaPrimary.href,
          label: RESOURCES_PAGE_CONTENT.closingSection.ctaPrimary.label,
        }}
        secondary={{
          href: RESOURCES_PAGE_CONTENT.closingSection.ctaSecondary.href,
          label: RESOURCES_PAGE_CONTENT.closingSection.ctaSecondary.label,
        }}
      />
    </>
  );
}
