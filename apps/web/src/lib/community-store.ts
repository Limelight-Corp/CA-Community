/**
 * Community data access (server-only) — PostgreSQL through @ascend/db.
 *
 * Content (events, speakers, news, settings …) and private records (bookings, memberships,
 * messages, mentorship) live in the `ascend` database; see packages/db. The functions keep the
 * names and shapes the app used with the old JSON files, but are async. Uploaded files (resource
 * documents, member photos, the mail outbox) still live on disk under dataDir().
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import {
  DEFAULT_SITE_SETTINGS,
  INITIAL_COMMUNITY_DATA,
  type CommunityContentType,
  type CommunityStoreData,
  type SiteSettings,
} from '@ascend/shared';
import { cache } from 'react';
import { revalidateTag, unstable_cache } from 'next/cache';
import { store } from '@ascend/db';

export type ContentType = CommunityContentType;
export { store };

/** Directory for files kept on disk (resource documents, member photos, mail outbox). */
export function dataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  const candidates = [
    path.resolve(process.cwd(), '../../data'),
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), 'data'),
  ];
  for (const dir of candidates) if (fs.existsSync(dir)) return dir;
  const primary = candidates[0]!;
  try {
    fs.mkdirSync(primary, { recursive: true });
    return primary;
  } catch {
    const tmp = path.join(os.tmpdir(), 'ascend-data');
    fs.mkdirSync(tmp, { recursive: true });
    return tmp;
  }
}

/** Local JSON fallback loader for when PostgreSQL is not running or unreachable in development */
function readJsonFallback(): CommunityStoreData {
  try {
    const candidates = [
      path.resolve(process.cwd(), '../../data/community-store.json'),
      path.resolve(process.cwd(), '../data/community-store.json'),
      path.resolve(process.cwd(), 'data/community-store.json'),
    ];
    for (const f of candidates) {
      if (fs.existsSync(f)) {
        const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
        return {
          events: raw.events ?? [],
          gallery: raw.gallery ?? [],
          speakers: raw.speakers ?? [],
          wings: raw.wings ?? [],
          news: raw.news ?? [],
          resources: raw.resources ?? [],
          team: raw.team ?? INITIAL_COMMUNITY_DATA.team,
          testimonials: raw.testimonials ?? [],
          initiatives: raw.initiatives ?? INITIAL_COMMUNITY_DATA.initiatives,
          jobs: raw.jobs ?? [],
          settings: {
            ...DEFAULT_SITE_SETTINGS,
            ...(raw.settings ?? {}),
            contact: { ...DEFAULT_SITE_SETTINGS.contact, ...(raw.settings?.contact ?? {}) },
            social: { ...DEFAULT_SITE_SETTINGS.social, ...(raw.settings?.social ?? {}) },
          },
        };
      }
    }
  } catch (err) {
    console.error('Failed to read fallback community-store.json:', err);
  }
  return INITIAL_COMMUNITY_DATA;
}

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

// Public content is cached across requests for CONTENT_TTL seconds (Next data cache), so most page
// views never wait on the database. Admin edits show up on the site within that time; bookings and
// seat checks read the database directly (store.getEvent inside a row lock), never this cache.
const CONTENT_TTL = 60;
const CONTENT_TAG = 'community-content';
const shared = { revalidate: CONTENT_TTL, tags: [CONTENT_TAG] };

/** Drops the cached content after the website itself changes it. */
function contentChanged(): void {
  try {
    revalidateTag(CONTENT_TAG);
  } catch {
    // Outside a request (scripts): nothing cached to drop.
  }
}

/** Every content collection plus settings (sitemap, search). */
export const readStore = cache(
  unstable_cache(
    async (): Promise<CommunityStoreData> => {
      try {
        return await store.readContentStore();
      } catch (err) {
        console.warn('[CommunityStore] Database unavailable, falling back to local data snapshot.');
        return readJsonFallback();
      }
    },
    ['content-store'],
    shared
  )
);

/** Site settings (layout, metadata and pages all ask for them). */
export const getSettings = cache(
  unstable_cache(
    async (): Promise<SiteSettings> => {
      try {
        return await store.getSettings();
      } catch (err) {
        console.warn('[CommunityStore] Database unavailable, falling back to local settings.');
        return readJsonFallback().settings;
      }
    },
    ['settings'],
    shared
  )
);

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    const settings = await store.updateSettings(updates);
    contentChanged();
    return settings;
  } catch (err) {
    console.warn('[CommunityStore] Database unavailable for updateSettings.');
    return { ...DEFAULT_SITE_SETTINGS, ...updates };
  }
}

/** Admin-edited legal pages (empty until the admin saves one, or if the table is not there yet). */
export const getLegalOverrides = cache(
  unstable_cache(
    async () => {
      try {
        return await store.listLegalDocuments();
      } catch (err) {
        return [];
      }
    },
    ['legal-docs'],
    shared
  )
);

// Also cached per request (React cache): pages, metadata and helpers often ask for the same list.
const listCached = cache(
  unstable_cache(
    async (type: ContentType, publishedOnly: boolean) => {
      try {
        return await store.listContent(type, publishedOnly);
      } catch (err) {
        console.warn(`[CommunityStore] Database unavailable for listContent(${type}), falling back to local data snapshot.`);
        const data = readJsonFallback();
        const list = (data[type] || []) as any[];
        return publishedOnly ? list.filter((item) => item.isPublished !== false) : list;
      }
    },
    ['content-list'],
    shared
  )
);

/** A content collection, newest first. Treat the result as read-only (it is shared per request). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getItems<T = any>(type: ContentType, publishedOnly = false): Promise<T[]> {
  return (await listCached(type, publishedOnly)) as unknown as T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addItem(type: ContentType, itemData: any): Promise<any> {
  try {
    const item = await store.createContent(type, itemData);
    contentChanged();
    return item;
  } catch (err) {
    console.warn(`[CommunityStore] Database unavailable for addItem(${type}).`);
    return itemData;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateItem(type: ContentType, id: string, updates: any): Promise<any | null> {
  try {
    const item = await store.updateContent(type, id, updates);
    contentChanged();
    return item;
  } catch (err) {
    console.warn(`[CommunityStore] Database unavailable for updateItem(${type}).`);
    return { id, ...updates };
  }
}

export async function deleteItem(type: ContentType, id: string): Promise<boolean> {
  try {
    const deleted = await store.deleteContent(type, id);
    contentChanged();
    return deleted;
  } catch (err) {
    console.warn(`[CommunityStore] Database unavailable for deleteItem(${type}).`);
    return false;
  }
}

// Private records (bookings, memberships, mentorship) are read with targeted queries through
// `store` (see @ascend/db). The website's database role cannot read the whole private store —
// e.g. the contact inbox is admin-only — so there is deliberately no readPrivate() here.

// ---------------------------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------------------------

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newSecret(): string {
  return crypto.randomBytes(18).toString('base64url');
}
