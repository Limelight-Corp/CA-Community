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
import { cache } from 'react';
import {
  DEFAULT_SITE_SETTINGS,
  INITIAL_COMMUNITY_DATA,
  type CommunityContentType,
  type CommunityStoreData,
  type SiteSettings,
  type PrivateStoreData,
} from '@ascend/shared';
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

/**
 * Every content collection plus settings (admin lists, sitemap, search).
 * Cached per request: the console layout, the page and analytics all read it, and on Vercel each
 * function has a single database connection, so repeated reads would queue behind each other.
 */
export const readStore = cache(async (): Promise<CommunityStoreData> => {
  try {
    return await store.readContentStore();
  } catch (err) {
    console.warn('[Admin CommunityStore] Database unavailable, falling back to local JSON data.');
    return readJsonFallback();
  }
});

export async function getSettings(): Promise<SiteSettings> {
  try {
    return await store.getSettings();
  } catch (err) {
    console.warn('[Admin CommunityStore] Database unavailable, falling back to local settings.');
    return readJsonFallback().settings;
  }
}

export async function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  try {
    return await store.updateSettings(updates);
  } catch (err) {
    console.warn('[Admin CommunityStore] Database unavailable for updateSettings.');
    return { ...DEFAULT_SITE_SETTINGS, ...updates };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getItems<T = any>(type: ContentType, publishedOnly = false): Promise<T[]> {
  try {
    return (await store.listContent(type, publishedOnly)) as unknown as T[];
  } catch (err) {
    console.warn(`[Admin CommunityStore] Database unavailable for getItems(${type}), falling back to local JSON data.`);
    const data = readJsonFallback();
    const list = (data[type] || []) as any[];
    return (publishedOnly ? list.filter((item) => item.isPublished !== false) : list) as T[];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addItem(type: ContentType, itemData: any): Promise<any> {
  try {
    return await store.createContent(type, itemData);
  } catch (err) {
    console.warn(`[Admin CommunityStore] Database unavailable for addItem(${type}).`);
    return itemData;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateItem(type: ContentType, id: string, updates: any): Promise<any | null> {
  try {
    return await store.updateContent(type, id, updates);
  } catch (err) {
    console.warn(`[Admin CommunityStore] Database unavailable for updateItem(${type}).`);
    return { id, ...updates };
  }
}

export async function deleteItem(type: ContentType, id: string): Promise<boolean> {
  try {
    return await store.deleteContent(type, id);
  } catch (err) {
    console.warn(`[Admin CommunityStore] Database unavailable for deleteItem(${type}).`);
    return false;
  }
}

// ---------------------------------------------------------------------------------------------
// Private records
// ---------------------------------------------------------------------------------------------

/** Local JSON fallback loader for private records when PostgreSQL is not running or unreachable in development */
function readPrivateJsonFallback(): PrivateStoreData {
  try {
    const candidates = [
      path.resolve(process.cwd(), '../../data/private-store.json'),
      path.resolve(process.cwd(), '../data/private-store.json'),
      path.resolve(process.cwd(), 'data/private-store.json'),
    ];
    for (const f of candidates) {
      if (fs.existsSync(f)) {
        const raw = JSON.parse(fs.readFileSync(f, 'utf-8'));
        return {
          registrations: raw.registrations ?? [],
          members: raw.members ?? [],
          messages: raw.messages ?? [],
          mentors: raw.mentors ?? [],
          mentorshipRequests: raw.mentorshipRequests ?? [],
        };
      }
    }
  } catch (err) {
    console.error('Failed to read fallback private-store.json:', err);
  }
  return {
    registrations: [],
    members: [],
    messages: [],
    mentors: [],
    mentorshipRequests: [],
  };
}

/** Bookings, memberships, messages and mentorship in one snapshot (admin lists, exports). Cached per request. */
export const readPrivate = cache(async (): Promise<PrivateStoreData> => {
  try {
    return await store.readPrivateStore();
  } catch (err) {
    console.warn('[Admin CommunityStore] Database unavailable, falling back to local private JSON data.');
    return readPrivateJsonFallback();
  }
});

// ---------------------------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------------------------

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newSecret(): string {
  return crypto.randomBytes(18).toString('base64url');
}
