/**
 * Legal pages: the admin's saved wording (Admin → Legal pages) over the default drafts in
 * @ascend/shared. Cached like the rest of the public content.
 */
import { LEGAL_DOCS, applyLegalOverride } from '@ascend/shared';
import { getLegalOverrides } from './community-store';

export async function legalDocs() {
  const overrides = await getLegalOverrides();
  return LEGAL_DOCS.map((d) => applyLegalOverride(d, overrides.find((o) => o.slug === d.slug)));
}

export async function legalDoc(slug: string) {
  return (await legalDocs()).find((d) => d.slug === slug);
}
