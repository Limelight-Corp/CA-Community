/** Live wings and admin-managed category lists (server only). */
import { taxonomy, wingsFromStore, type OrgWing, type TaxonomyKey } from '@ascend/shared';
import { readStore } from './community-store';
import { CONTENT_TYPES, type ManagedContentType } from './content-config';

/** Every wing in the CMS (drafts included, so content can be linked before a wing goes live). */
export async function adminWings(): Promise<OrgWing[]> {
  return wingsFromStore((await readStore()).wings, false);
}

export async function adminTaxonomy(key: TaxonomyKey): Promise<string[]> {
  return taxonomy((await readStore()).settings, key);
}

export const wingLabel = (wings: OrgWing[], n: number) => wings.find((w) => w.number === n)?.name ?? `Wing ${n}`;

/** Select options for the store-backed fields of a content type, keyed by field name. */
export async function fieldOptions(type: ManagedContentType): Promise<Record<string, string[]>> {
  const store = await readStore();
  const out: Record<string, string[]> = {};
  for (const f of CONTENT_TYPES[type].fields) {
    if (!f.optionsFrom) continue;
    out[f.name] = f.optionsFrom === 'wings' ? wingsFromStore(store.wings, false).map((w) => w.name) : taxonomy(store.settings, f.optionsFrom);
  }
  return out;
}
