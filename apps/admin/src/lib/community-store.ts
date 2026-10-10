/**
 * File-backed community store (server-only).
 *
 * - data/community-store.json  — public CMS content (events, speakers, news, settings …)
 * - data/private-store.json    — registrations, membership applications, contact messages.
 *                                Contains personal data: gitignored, never served publicly.
 *
 * This module is kept identical in apps/web and apps/admin. Interim persistence until the
 * Express API + PostgreSQL take over; writes are synchronous and atomic (temp file + rename),
 * so a read-modify-write inside one request cannot interleave with another in this process.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CommunityStoreData,
  CommunityContentType,
  INITIAL_COMMUNITY_DATA,
  DEFAULT_SITE_SETTINGS,
  PrivateStoreData,
  INITIAL_PRIVATE_DATA,
  SiteSettings,
} from '@ascend/shared';

export type ContentType = CommunityContentType;

function findDataDir(): string {
  const candidates = [
    path.resolve(process.cwd(), '../../data'),
    path.resolve(process.cwd(), '../data'),
    path.resolve(process.cwd(), 'data'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'community-store.json'))) return dir;
  }
  const primary = candidates[0]!;
  fs.mkdirSync(primary, { recursive: true });
  return primary;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return structuredClone(fallback);
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch (err) {
    console.error(`Failed to read ${path.basename(file)}:`, err);
    return structuredClone(fallback);
  }
}

function writeJsonAtomic(file: string, data: unknown): void {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

/** Absolute path of the shared data directory. */
export function dataDir(): string {
  return findDataDir();
}

const contentFile = () => path.join(findDataDir(), 'community-store.json');
const privateFile = () => path.join(findDataDir(), 'private-store.json');

// ---------------------------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------------------------

/** Fills in collections/settings added after a store file was created. */
function normalize(data: Partial<CommunityStoreData>): CommunityStoreData {
  return {
    events: data.events ?? [],
    gallery: data.gallery ?? [],
    speakers: data.speakers ?? [],
    wings: data.wings ?? [],
    news: data.news ?? [],
    resources: data.resources ?? [],
    team: data.team ?? INITIAL_COMMUNITY_DATA.team,
    testimonials: data.testimonials ?? [],
    initiatives: data.initiatives ?? INITIAL_COMMUNITY_DATA.initiatives,
    jobs: data.jobs ?? [],
    settings: {
      ...DEFAULT_SITE_SETTINGS,
      ...(data.settings ?? {}),
      contact: { ...DEFAULT_SITE_SETTINGS.contact, ...(data.settings?.contact ?? {}) },
      social: { ...DEFAULT_SITE_SETTINGS.social, ...(data.settings?.social ?? {}) },
    },
  };
}

export function readStore(): CommunityStoreData {
  const file = contentFile();
  if (!fs.existsSync(file)) writeJsonAtomic(file, INITIAL_COMMUNITY_DATA);
  return normalize(readJson<Partial<CommunityStoreData>>(file, INITIAL_COMMUNITY_DATA));
}

export function writeStore(data: CommunityStoreData): void {
  writeJsonAtomic(contentFile(), data);
}

export function getSettings(): SiteSettings {
  return readStore().settings;
}

export function updateSettings(updates: Partial<SiteSettings>): SiteSettings {
  const store = readStore();
  store.settings = {
    ...store.settings,
    ...updates,
    contact: { ...store.settings.contact, ...(updates.contact ?? {}) },
    social: { ...store.settings.social, ...(updates.social ?? {}) },
  };
  writeStore(store);
  return store.settings;
}

export function getItems<T = any>(type: ContentType, publishedOnly = false): T[] {
  const list = (readStore()[type] || []) as any[];
  return (publishedOnly ? list.filter((item) => item.isPublished !== false) : list) as T[];
}

export function addItem(type: ContentType, itemData: any): any {
  const store = readStore();
  const list = (store[type] || []) as any[];
  const stamp = new Date().toISOString();
  const newItem = {
    ...itemData,
    id: itemData.id || `${type.slice(0, 3)}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    isPublished: itemData.isPublished !== undefined ? itemData.isPublished : true,
    createdAt: stamp,
    updatedAt: stamp,
  };
  (store as any)[type] = [newItem, ...list];
  writeStore(store);
  return newItem;
}

export function updateItem(type: ContentType, id: string, updates: any): any | null {
  const store = readStore();
  const list = (store[type] || []) as any[];
  const index = list.findIndex((x) => x.id === id);
  if (index === -1) return null;
  list[index] = { ...list[index], ...updates, id, updatedAt: new Date().toISOString() };
  (store as any)[type] = list;
  writeStore(store);
  return list[index];
}

export function deleteItem(type: ContentType, id: string): boolean {
  const store = readStore();
  const list = (store[type] || []) as any[];
  const next = list.filter((x) => x.id !== id);
  if (next.length === list.length) return false;
  (store as any)[type] = next;
  writeStore(store);
  return true;
}

// ---------------------------------------------------------------------------------------------
// Private submissions
// ---------------------------------------------------------------------------------------------

export function readPrivate(): PrivateStoreData {
  const data = readJson<Partial<PrivateStoreData>>(privateFile(), INITIAL_PRIVATE_DATA);
  return {
    registrations: data.registrations ?? [],
    members: data.members ?? [],
    messages: data.messages ?? [],
    mentors: data.mentors ?? [],
    mentorshipRequests: data.mentorshipRequests ?? [],
  };
}

export function writePrivate(data: PrivateStoreData): void {
  writeJsonAtomic(privateFile(), data);
}

/** Runs a synchronous read-modify-write on the private store and persists the result. */
export function mutatePrivate<R>(fn: (data: PrivateStoreData) => R): R {
  const data = readPrivate();
  const result = fn(data);
  writePrivate(data);
  return result;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

export function newSecret(): string {
  return crypto.randomBytes(18).toString('base64url');
}
