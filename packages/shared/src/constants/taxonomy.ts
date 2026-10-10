/**
 * Admin-managed lists ("taxonomies") and wings. The constants in organisation.ts / jobs.ts are the
 * defaults; once an admin edits a list it is stored in Site Settings and used everywhere instead.
 */
import type { CommunityWing, SiteSettings } from '../data/initial-data';
import { EVENT_CATEGORIES, GALLERY_CATEGORIES, NEWS_CATEGORIES, ORG_WINGS, RESOURCE_CATEGORIES, type OrgWing } from './organisation';
import { JOB_TYPES } from './jobs';

export const TAXONOMY_KEYS = ['eventCategories', 'newsCategories', 'resourceCategories', 'galleryCategories', 'jobTypes'] as const;
export type TaxonomyKey = (typeof TAXONOMY_KEYS)[number];

export const TAXONOMY_DEFAULTS: Record<TaxonomyKey, readonly string[]> = {
  eventCategories: EVENT_CATEGORIES,
  newsCategories: NEWS_CATEGORIES,
  resourceCategories: RESOURCE_CATEGORIES,
  galleryCategories: GALLERY_CATEGORIES,
  jobTypes: JOB_TYPES,
};

/** Admin labels and the content collection + field each list applies to. */
export const TAXONOMY_META: Record<TaxonomyKey, { label: string; collection: 'events' | 'news' | 'resources' | 'gallery' | 'jobs'; field: string }> = {
  eventCategories: { label: 'Event categories', collection: 'events', field: 'category' },
  newsCategories: { label: 'News categories', collection: 'news', field: 'category' },
  resourceCategories: { label: 'Knowledge Hub categories', collection: 'resources', field: 'category' },
  galleryCategories: { label: 'Gallery categories', collection: 'gallery', field: 'category' },
  jobTypes: { label: 'Job & articleship types', collection: 'jobs', field: 'type' },
};

export function isTaxonomyKey(value: unknown): value is TaxonomyKey {
  return typeof value === 'string' && (TAXONOMY_KEYS as readonly string[]).includes(value);
}

/** The current list for a taxonomy: the admin's saved list, or the default. */
export function taxonomy(settings: Pick<SiteSettings, 'taxonomies'> | undefined, key: TaxonomyKey): string[] {
  const saved = settings?.taxonomies?.[key];
  return saved && saved.length ? [...saved] : [...TAXONOMY_DEFAULTS[key]];
}

/** Configured values first, then any other values still used by content (so nothing becomes unfilterable). */
export function withUsedValues(list: readonly string[], used: Iterable<string | undefined>): string[] {
  const out = [...list];
  const seen = new Set(list.map((v) => v.toLowerCase()));
  for (const v of used) {
    const t = v?.trim();
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      out.push(t);
    }
  }
  return out;
}

/**
 * Wings as managed in the CMS (`wings` collection), sorted by number. Focus areas come from the
 * wing's "tags" line ("Direct Tax · GST"). Falls back to the documented ten wings only when there is no
 * wings collection at all (an admin who removes every wing gets an empty list).
 */
export function wingsFromStore(store: readonly CommunityWing[] | undefined, publishedOnly = true): OrgWing[] {
  const rows = (store ?? []).filter((w) => !publishedOnly || w.isPublished !== false);
  if (!store) return ORG_WINGS.map((w) => ({ ...w }));
  return [...rows]
    .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
    .map((w) => {
      const org = ORG_WINGS.find((o) => o.number === w.number && o.name === w.name);
      const focus = (w.tags ?? '')
        .split(/\s*[·•|,]\s*/)
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        number: Number(w.number),
        name: w.name,
        focus: focus.length ? focus : (org?.focus ?? []),
        activities: w.activities?.length ? [...w.activities] : (org?.activities ?? []),
      };
    });
}
