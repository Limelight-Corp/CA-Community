/** Live wings and admin-managed category lists (server only). */
import { taxonomy, wingsFromStore, type OrgWing, type TaxonomyKey } from '@ascend/shared';
import { readStore } from './community-store';
import { CONTENT_TYPES, type ManagedContentType } from './content-config';

/** Every wing in the CMS (drafts included, so content can be linked before a wing goes live). */
export function adminWings(): OrgWing[] {
  return wingsFromStore(readStore().wings, false);
}

export function adminTaxonomy(key: TaxonomyKey): string[] {
  return taxonomy(readStore().settings, key);
}

export const wingLabel = (wings: OrgWing[], n: number) => wings.find((w) => w.number === n)?.name ?? `Wing ${n}`;

/** Select options for the store-backed fields of a content type, keyed by field name. */
export function fieldOptions(type: ManagedContentType): Record<string, string[]> {
  const store = readStore();
  const out: Record<string, string[]> = {};
  for (const f of CONTENT_TYPES[type].fields) {
    if (!f.optionsFrom) continue;
    out[f.name] = f.optionsFrom === 'wings' ? wingsFromStore(store.wings, false).map((w) => w.name) : taxonomy(store.settings, f.optionsFrom);
  }
  return out;
}
