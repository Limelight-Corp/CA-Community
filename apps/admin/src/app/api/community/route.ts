import { NextRequest, NextResponse } from 'next/server';
import { COMMUNITY_CONTENT_TYPES, type CommunityEvent } from '@ascend/shared';
import {
  readStore,
  writeStore,
  readPrivate,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  ContentType,
} from '../../../lib/community-store';
import { CONTENT_TYPES } from '../../../lib/content-config';
import { eventChanges, notifyEventUpdated } from '../../../lib/notifications';
import {
  contentSchema,
  eventBaseSchema,
  eventCrossFieldErrors,
  eventUpdateSchema,
  issuesToFieldErrors,
} from '../../../lib/content-validation';

/**
 * Admin content store (JSON file). Reachable only through the admin access gate
 * (see src/middleware.ts). Same-origin only: no CORS headers are sent, so other
 * origins cannot call it from a browser.
 *
 * Writes are validated against per-type schemas: unknown fields are dropped and every value is
 * type/length checked. Slugs are unique per collection.
 *
 * Interim: replaced by the Express API + PostgreSQL in later phases.
 */

export const dynamic = 'force-dynamic';

function isContentType(value: unknown): value is ContentType {
  return typeof value === 'string' && (COMMUNITY_CONTENT_TYPES as readonly string[]).includes(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bad(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ success: false, error: message, fieldErrors }, { status });
}

function serverError(error: unknown) {
  console.error('Admin community store error:', error);
  return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
}

function slugTaken(type: ContentType, slug: unknown, exceptId?: string): boolean {
  if (typeof slug !== 'string' || !slug) return false;
  return (getItems(type) as { id: string; slug?: string }[]).some((x) => x.slug === slug && x.id !== exceptId);
}

type Validated = { ok: true; data: Record<string, unknown> } | { ok: false; response: NextResponse };

function validate(type: ContentType, input: Record<string, unknown>, partial: boolean): Validated {
  const schema =
    type === 'events'
      ? partial
        ? eventUpdateSchema
        : eventBaseSchema
      : partial
        ? contentSchema(type).partial()
        : contentSchema(type);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = issuesToFieldErrors(parsed.error);
    return { ok: false, response: bad(Object.values(fieldErrors)[0] ?? 'Invalid data', 422, fieldErrors) };
  }
  return { ok: true, data: parsed.data as Record<string, unknown> };
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
      const data: Record<string, unknown> = { settings: allData.settings };
      for (const t of COMMUNITY_CONTENT_TYPES) data[t] = published(allData[t] as { isPublished?: boolean }[]);
      return NextResponse.json({ success: true, data });
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
    if (type !== 'events' && !CONTENT_TYPES[type].allowCreate) return bad('New items cannot be added to this collection', 403);

    const result = validate(type, item, false);
    if (!result.ok) return result.response;
    const data = result.data;

    if (type === 'events') {
      const cross = eventCrossFieldErrors(data);
      if (Object.keys(cross).length) return bad(Object.values(cross)[0]!, 422, cross);
      data.seatsTaken = 0;
    } else {
      Object.assign(data, CONTENT_TYPES[type].createDefaults ?? {});
    }
    if (slugTaken(type, data.slug)) return bad('This URL slug is already used', 409, { slug: 'This URL slug is already used' });

    const created = addItem(type, data);
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

    const existing = (getItems(type) as Record<string, unknown>[]).find((x) => x.id === id);
    if (!existing) return bad('Item not found', 404);

    // Only declared fields pass validation; id, createdAt and seatsTaken can never be set here.
    const result = validate(type, updates, true);
    if (!result.ok) return result.response;
    const data = result.data;

    if (type === 'events') {
      const cross = eventCrossFieldErrors({ ...existing, ...data } as Record<string, never>);
      const relevant = Object.fromEntries(
        Object.entries(cross).filter(([k]) => k in data || (k === 'memberFee' && 'fee' in data) || (k === 'city' && 'mode' in data))
      );
      if (Object.keys(relevant).length) return bad(Object.values(relevant)[0]!, 422, relevant);
      const taken = Number(existing.seatsTaken) || 0;
      if (typeof data.seatsTotal === 'number' && data.seatsTotal < taken) {
        const message = `Capacity cannot be below the ${taken} seats already taken`;
        return bad(message, 422, { seatsTotal: message });
      }
    }
    if ('slug' in data && slugTaken(type, data.slug, id)) {
      return bad('This URL slug is already used', 409, { slug: 'This URL slug is already used' });
    }

    const updated = updateItem(type, id, data);
    if (!updated) return bad('Item not found', 404);
    // Events reference speakers by slug: follow a renamed slug so their speaker lists stay intact.
    if (type === 'speakers' && typeof existing.slug === 'string' && 'slug' in data && data.slug !== existing.slug) {
      relinkSpeaker(existing.slug, String(data.slug));
    }
    // Date / time / venue changes are emailed to registered attendees unless the admin opts out.
    let notified = 0;
    if (type === 'events' && body.notifyAttendees !== false) {
      notified = notifyEventUpdated(updated as CommunityEvent, eventChanges(existing as unknown as CommunityEvent, updated as CommunityEvent));
    }
    return NextResponse.json({ success: true, item: updated, notified });
  } catch (error) {
    return serverError(error);
  }
}

/** Replaces (or, with `to = null`, removes) a speaker slug in every event's speaker list. */
function relinkSpeaker(from: string, to: string | null): void {
  const store = readStore();
  let changed = false;
  for (const e of store.events) {
    if (!e.speakerSlugs?.includes(from)) continue;
    const next = e.speakerSlugs.map((s) => (s === from ? to : s)).filter((s): s is string => !!s);
    e.speakerSlugs = Array.from(new Set(next));
    changed = true;
  }
  if (changed) writeStore(store);
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
    if (type !== 'events' && !CONTENT_TYPES[type].allowDelete) return bad('Items in this collection cannot be deleted', 403);

    if (type === 'events') {
      const active = readPrivate().registrations.filter((r) => r.eventId === id && r.status !== 'cancelled').length;
      if (active > 0) {
        return bad(
          `This event has ${active} active registration${active === 1 ? '' : 's'}. Unpublish it or cancel the registrations instead.`,
          409
        );
      }
    }

    const speakerSlug = type === 'speakers' ? (getItems('speakers') as { id: string; slug?: string }[]).find((s) => s.id === id)?.slug : undefined;
    const deleted = deleteItem(type, id);
    if (!deleted) return bad('Item not found', 404);
    if (speakerSlug) relinkSpeaker(speakerSlug, null);

    return NextResponse.json({ success: true, deleted: true, id });
  } catch (error) {
    return serverError(error);
  }
}
