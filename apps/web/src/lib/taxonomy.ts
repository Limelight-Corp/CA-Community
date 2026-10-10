/** Live wings and admin-managed category lists for the website (server only). */
import { taxonomy, withUsedValues, wingsFromStore, type OrgWing, type TaxonomyKey } from '@ascend/shared';
import { readStore } from './community-store';

/** Published wings, in number order (managed in admin → Wings). */
export function siteWings(): OrgWing[] {
  return wingsFromStore(readStore().wings, true);
}

export function wingByNumber(n: number): OrgWing | undefined {
  return siteWings().find((w) => w.number === n);
}

export function wingName(n: number): string {
  return wingByNumber(n)?.name ?? `Wing ${n}`;
}

/** Keeps only wing numbers that exist on the site (drops removed or unpublished wings). */
export function knownWingNumbers(list: readonly number[]): number[] {
  const valid = new Set(siteWings().map((w) => w.number));
  return [...new Set(list)].filter((n) => valid.has(n)).sort((a, b) => a - b);
}

/** A managed list, followed by any other values still used by the given items. */
export function siteTaxonomy(key: TaxonomyKey, used: Iterable<string | undefined> = []): string[] {
  return withUsedValues(taxonomy(readStore().settings, key), used);
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

/** "Ten wings" style label for headings, following the number of published wings. */
export function wingCountWords(n = siteWings().length): string {
  return `${WORDS[n] ?? n} wing${n === 1 ? '' : 's'}`;
}
