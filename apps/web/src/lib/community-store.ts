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
import type { CommunityContentType, CommunityStoreData, SiteSettings } from '@ascend/shared';
import { cache } from 'react';
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

/** Every content collection plus settings (admin lists, sitemap, search). */
export function readStore(): Promise<CommunityStoreData> {
  return store.readContentStore();
}

/** Site settings (cached per request: layout, metadata and page all ask for them). */
export const getSettings = cache((): Promise<SiteSettings> => store.getSettings());

export function updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
  return store.updateSettings(updates);
}

// Cached per request (React cache): pages, metadata and helpers often ask for the same list.
const listCached = cache((type: ContentType, publishedOnly: boolean) => store.listContent(type, publishedOnly));

/** A content collection, newest first. Treat the result as read-only (it is shared per request). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getItems<T = any>(type: ContentType, publishedOnly = false): Promise<T[]> {
  return (await listCached(type, publishedOnly)) as unknown as T[];
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
