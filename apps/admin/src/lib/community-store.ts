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
import type { CommunityContentType, CommunityStoreData, SiteSettings, PrivateStoreData } from '@ascend/shared';
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

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

/**
 * Every content collection plus settings (admin lists, sitemap, search).
 * Cached per request: the console layout, the page and analytics all read it, and on Vercel each
 * function has a single database connection, so repeated reads would queue behind each other.
 */
export const readStore = cache((): Promise<CommunityStoreData> => store.readContentStore());

export function getSettings(): Promise<SiteSettings> {
  return store.getSettings();
}

export function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  return store.updateSettings(updates);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getItems<T = any>(type: ContentType, publishedOnly = false): Promise<T[]> {
  return (await store.listContent(type, publishedOnly)) as unknown as T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function addItem(type: ContentType, itemData: any): Promise<any> {
  return store.createContent(type, itemData);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateItem(type: ContentType, id: string, updates: any): Promise<any | null> {
  return store.updateContent(type, id, updates);
}

export function deleteItem(type: ContentType, id: string): Promise<boolean> {
  return store.deleteContent(type, id);
}

// ---------------------------------------------------------------------------------------------
// Private records
// ---------------------------------------------------------------------------------------------

/** Bookings, memberships, messages and mentorship in one snapshot (admin lists, exports). Cached per request. */
export const readPrivate = cache((): Promise<PrivateStoreData> => store.readPrivateStore());

// ---------------------------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------------------------

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newSecret(): string {
  return crypto.randomBytes(18).toString('base64url');
}
