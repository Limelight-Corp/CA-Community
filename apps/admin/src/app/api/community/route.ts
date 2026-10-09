import { NextRequest, NextResponse } from 'next/server';
import {
  readStore,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  ContentType,
} from '../../../lib/community-store';

/**
 * Admin content store (JSON file). Reachable only through the admin access gate
 * (see src/middleware.ts). Same-origin only: no CORS headers are sent, so other
 * origins cannot call it from a browser.
 *
 * Interim: replaced by the Express API + PostgreSQL in later phases.
 */

const CONTENT_TYPES: readonly ContentType[] = [
  'events',
  'gallery',
  'speakers',
  'wings',
  'news',
  'resources',
];

function isContentType(value: unknown): value is ContentType {
  return typeof value === 'string' && (CONTENT_TYPES as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bad(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

function serverError(error: unknown) {
  console.error('Admin community store error:', error);
  return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const publishedOnly = searchParams.get('publishedOnly') === 'true';

    if (type !== null) {
      if (!isContentType(type)) return bad('Unknown content type');
      const items = getItems(type, publishedOnly);
      return NextResponse.json({ success: true, type, count: items.length, data: items });
    }

    const allData = readStore();
    if (publishedOnly) {
      const published = <T extends { isPublished?: boolean }>(list: T[] | undefined) =>
        (list || []).filter((x) => x.isPublished !== false);
      return NextResponse.json({
        success: true,
        data: {
          events: published(allData.events),
          gallery: published(allData.gallery),
          speakers: published(allData.speakers),
          wings: published(allData.wings),
          news: published(allData.news),
          resources: published(allData.resources),
        },
      });
    }

    return NextResponse.json({ success: true, data: allData });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const { type, item } = body;

    if (!isContentType(type)) return bad('A valid content type is required');
    if (!isPlainObject(item)) return bad('Item must be an object');

    const created = addItem(type, item);
    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!isPlainObject(body)) return bad('Invalid JSON body');
    const { type, id, updates } = body;

    if (!isContentType(type)) return bad('A valid content type is required');
    if (typeof id !== 'string' || id.length === 0) return bad('Item id is required');
    if (!isPlainObject(updates)) return bad('Updates must be an object');

    // The id is the record key and must not be changed through an update.
    const { id: _ignored, ...safeUpdates } = updates;
    const updated = updateItem(type, id, safeUpdates);
    if (!updated) return bad('Item not found', 404);

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let type: unknown = searchParams.get('type');
    let id: unknown = searchParams.get('id');

    if (!type || !id) {
      const body = await request.json().catch(() => null);
      if (isPlainObject(body)) {
        type = body.type;
        id = body.id;
      }
    }

    if (!isContentType(type)) return bad('A valid content type is required');
    if (typeof id !== 'string' || id.length === 0) return bad('Item id is required');

    const deleted = deleteItem(type, id);
    if (!deleted) return bad('Item not found', 404);

    return NextResponse.json({ success: true, deleted: true, id });
  } catch (error) {
    return serverError(error);
  }
}
