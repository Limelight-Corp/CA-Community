import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { TAXONOMY_META, isTaxonomyKey, taxonomy } from '@ascend/shared';
import { readStore, writeStore } from '../../../lib/community-store';
import { bad, handleError, isPlainObject } from '../../../lib/api-helpers';

/**
 * Admin-managed category lists (event / news / Knowledge Hub / gallery categories, job types).
 * Saved in Site Settings. Renames are applied to existing content; removed values stay on the
 * items that use them until they are edited. Admin gate protected.
 */
export const dynamic = 'force-dynamic';

const value = z.string().trim().min(1, 'Names cannot be empty').max(60, 'Keep names under 60 characters');
const bodySchema = z.object({
  key: z.string(),
  values: z.array(value).min(1, 'Keep at least one entry').max(60, 'Up to 60 entries'),
  /** Old name → new name, for entries that were renamed in the editor. */
  renames: z.record(value).default({}),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid list', 422);
    const { key, values, renames } = parsed.data;
    if (!isTaxonomyKey(key)) return bad('Unknown list', 400);

    const seen = new Set<string>();
    for (const v of values) {
      const k = v.toLowerCase();
      if (seen.has(k)) return bad(`“${v}” is listed twice`, 422);
      seen.add(k);
    }

    const store = readStore();
    const before = taxonomy(store.settings, key);
    store.settings = { ...store.settings, taxonomies: { ...store.settings.taxonomies, [key]: values } };

    // Follow renames in the content that uses this list.
    const { collection, field } = TAXONOMY_META[key];
    let moved = 0;
    const map = new Map(Object.entries(renames).filter(([from, to]) => from !== to && before.includes(from) && values.includes(to)));
    if (map.size) {
      for (const item of store[collection] as unknown as Record<string, unknown>[]) {
        const current = item[field];
        if (typeof current === 'string' && map.has(current)) {
          item[field] = map.get(current);
          moved++;
        }
      }
    }
    writeStore(store);
    return NextResponse.json({ success: true, values, moved });
  } catch (error) {
    return handleError(error, 'Taxonomies PUT');
  }
}

/** Resets a list to the built-in defaults (content keeps its values). */
export async function DELETE(request: NextRequest) {
  try {
    const key = new URL(request.url).searchParams.get('key');
    if (!isTaxonomyKey(key)) return bad('Unknown list', 400);
    const store = readStore();
    const next = { ...store.settings.taxonomies };
    delete next[key];
    store.settings = { ...store.settings, taxonomies: next };
    writeStore(store);
    return NextResponse.json({ success: true, values: taxonomy(store.settings, key) });
  } catch (error) {
    return handleError(error, 'Taxonomies DELETE');
  }
}
