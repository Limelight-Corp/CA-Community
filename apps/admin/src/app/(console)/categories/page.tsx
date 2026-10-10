import type { Metadata } from 'next';
import { TAXONOMY_KEYS, TAXONOMY_META, taxonomy } from '@ascend/shared';
import { readStore } from '../../../lib/community-store';
import { PageHeader } from '../../../components/ui/Display';
import { TaxonomyManager, type TaxonomyList } from '../../../components/settings/TaxonomyManager';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Categories' };

const USED_IN: Record<string, string> = {
  events: 'Events',
  news: 'News & Updates',
  resources: 'Knowledge Hub',
  gallery: 'Gallery',
  jobs: 'Jobs & articleship',
};

export default function CategoriesPage() {
  const store = readStore();
  const lists: TaxonomyList[] = TAXONOMY_KEYS.map((key) => {
    const { label, collection, field } = TAXONOMY_META[key];
    const usage: Record<string, number> = {};
    for (const item of store[collection] as unknown as Record<string, unknown>[]) {
      const v = item[field];
      if (typeof v === 'string' && v) usage[v] = (usage[v] ?? 0) + 1;
    }
    return {
      key,
      label,
      usedIn: `${USED_IN[collection]} → ${field === 'type' ? 'Type' : 'Category'}`,
      values: taxonomy(store.settings, key),
      usage,
      isDefault: !store.settings.taxonomies?.[key]?.length,
    };
  });
  return (
    <>
      <PageHeader
        eyebrow="Website content"
        title="Categories"
        accent="& types."
        description="Add, rename, reorder or remove the categories used in the admin forms and the website filters. Renaming moves existing items to the new name."
      />
      <TaxonomyManager lists={lists} />
    </>
  );
}
