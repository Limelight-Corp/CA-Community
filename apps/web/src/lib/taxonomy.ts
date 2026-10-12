/** Live wings and admin-managed category lists for the website (server only). */
import { taxonomy, withUsedValues, wingsFromStore, type OrgWing, type TaxonomyKey } from '@ascend/shared';
import { cache } from 'react';
import { getSettings, getItems } from './community-store';
import type { CommunityWing } from '@ascend/shared';

/** Published wings, in number order (managed in admin → Wings). Cached per request. */
export const siteWings = cache(async (): Promise<OrgWing[]> => wingsFromStore(await getItems<CommunityWing>('wings'), true));

export async function wingByNumber(n: number): Promise<OrgWing | undefined> {
  return (await siteWings()).find((w) => w.number === n);
}

export async function wingName(n: number): Promise<string> {
  return (await wingByNumber(n))?.name ?? `Wing ${n}`;
}

/** Keeps only wing numbers that exist on the site (drops removed or unpublished wings). */
export async function knownWingNumbers(list: readonly number[]): Promise<number[]> {
  const valid = new Set((await siteWings()).map((w) => w.number));
  return [...new Set(list)].filter((n) => valid.has(n)).sort((a, b) => a - b);
}

/** A managed list, followed by any other values still used by the given items. */
export async function siteTaxonomy(key: TaxonomyKey, used: Iterable<string | undefined> = []): Promise<string[]> {
  return withUsedValues(taxonomy(await getSettings(), key), used);
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

/** "Ten wings" style label for headings, following the number of published wings. */
export function wingCountWords(n: number): string {
  return `${WORDS[n] ?? n} wing${n === 1 ? '' : 's'}`;
}
