import fs from 'fs';
import path from 'path';
import { CommunityStoreData, INITIAL_COMMUNITY_DATA } from '@ascend/shared';

function resolveStorePath(): string {
  const candidates = [
    path.resolve(process.cwd(), '../../data/community-store.json'),
    path.resolve(process.cwd(), '../data/community-store.json'),
    path.resolve(process.cwd(), 'data/community-store.json'),
    'C:\\Limelight\\CA Community\\data\\community-store.json',
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to primary monorepo location
  const primary = path.resolve(process.cwd(), '../../data/community-store.json');
  const dir = path.dirname(primary);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(primary, JSON.stringify(INITIAL_COMMUNITY_DATA, null, 2), 'utf-8');
  return primary;
}

export function readStore(): CommunityStoreData {
  try {
    const filePath = resolveStorePath();
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read community store, returning initial fallback:', err);
    return INITIAL_COMMUNITY_DATA;
  }
}

export function writeStore(data: CommunityStoreData): void {
  try {
    const filePath = resolveStorePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write community store:', err);
  }
}

export type ContentType = 'events' | 'gallery' | 'speakers' | 'wings' | 'news' | 'resources';

export function getItems<T = any>(type: ContentType, publishedOnly = false): T[] {
  const store = readStore();
  const list = (store[type] || []) as any[];
  if (publishedOnly) {
    return list.filter((item) => item.isPublished !== false) as T[];
  }
  return list as T[];
}

export function addItem(type: ContentType, itemData: any): any {
  const store = readStore();
  const list = store[type] || [];

  const id = itemData.id || `${type.slice(0, 3)}-${Date.now()}`;
  const newItem = {
    ...itemData,
    id,
    isPublished: itemData.isPublished !== undefined ? itemData.isPublished : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  const updatedItem = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updatedItem;
  (store as any)[type] = list;
  writeStore(store);
  return updatedItem;
}

export function deleteItem(type: ContentType, id: string): boolean {
  const store = readStore();
  const list = (store[type] || []) as any[];
  const initialLength = list.length;
  (store as any)[type] = list.filter((x) => x.id !== id);
  if ((store as any)[type].length !== initialLength) {
    writeStore(store);
    return true;
  }
  return false;
}
