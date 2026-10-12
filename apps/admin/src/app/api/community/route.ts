import { NextRequest, NextResponse } from 'next/server';
import { COMMUNITY_CONTENT_TYPES, type CommunityEvent } from '@ascend/shared';
import {
  readStore,
  store,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  ContentType,
} from '../../../lib/community-store';
import { CONTENT_TYPES } from '../../../lib/content-config';
import { adminTaxonomy, adminWings, fieldOptions } from '../../../lib/taxonomy';
import { eventChanges, notifyEventUpdated } from '../../../lib/notifications';
import {
  contentSchema,
  eventBaseSchema,
  eventCrossFieldErrors,
  eventReferenceErrors,
  eventUpdateSchema,
  issuesToFieldErrors,
} from '../../../lib/content-validation';

/**
 * Admin content store (PostgreSQL). Reachable only through the admin access gate
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

async function slugTaken(type: ContentType, slug: unknown, exceptId?: string): Promise<boolean> {
  if (typeof slug !== 'string' || !slug) return false;
  return (await getItems(type) as { id: string; slug?: string }[]).some((x) => x.slug === slug && x.id !== exceptId);
}

type Validated = { ok: true; data: Record<string, unknown> } | { ok: false; response: NextResponse };

async function validate(type: ContentType, input: Record<string, unknown>, partial: boolean, existing?: Record<string, unknown>): Promise<Validated> {
  const schema =
    type === 'events'
      ? partial
        ? eventUpdateSchema
        : eventBaseSchema
      : partial
        ? contentSchema(type, await fieldOptions(type), existing).partial()
        : contentSchema(type, await fieldOptions(type), existing);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = issuesToFieldErrors(parsed.error);
    return { ok: false, response: bad(Object.values(fieldErrors)[0] ?? 'Invalid data', 422, fieldErrors) };
  }
  const data = parsed.data as Record<string, unknown>;
  if (type === 'events') {
    const refs = eventReferenceErrors(
      data,
      { categories: await adminTaxonomy('eventCategories'), wingNumbers: (await adminWings()).map((w) => w.number) },
      existing as { category?: string; wingNumber?: number } | undefined
    );
    if (Object.keys(refs).length) return { ok: false, response: bad(Object.values(refs)[0]!, 422, refs) };
  }
  if (type === 'wings') {
    const clash = await wingClash(data, typeof existing?.id === 'string' ? existing.id : undefined);
    if (clash) return { ok: false, response: bad(Object.values(clash)[0]!, 409, clash) };
  }
  return { ok: true, data };
}

/** Wing numbers and names must stay unique (events link by number; content links by name). */
async function wingClash(data: Record<string, unknown>, exceptId?: string): Promise<Record<string, string> | null> {
  const others = (await readStore()).wings.filter((w) => w.id !== exceptId);
  if (data.number !== undefined && others.some((w) => w.number === Number(data.number))) {
    return { number: `Wing number ${data.number} is already used` };
  }
  const name = typeof data.name === 'string' ? data.name.trim().toLowerCase() : '';
  if (name && others.some((w) => w.name.trim().toLowerCase() === name)) return { name: 'Another wing already has this name' };
  return null;
}

/** Content that links to a wing (the database also refuses to delete a wing that is still used). */
async function wingUsage(wingId: string): Promise<string[]> {
  const where = { wingId };
  const [events, resources, team, jobs] = await Promise.all([
    store.prisma.event.count({ where }),
    store.prisma.resource.count({ where }),
    store.prisma.teamMember.count({ where: { OR: [{ wingId }, { wings: { some: { wingId } } }] } }),
    store.prisma.job.count({ where }),
  ]);
  const parts: [number, string][] = [
    [events, 'event'],
    [resources, 'resource'],
    [team, 'team profile'],
    [jobs, 'job post'],
  ];
  return parts.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n === 1 ? '' : 's'}`);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const publishedOnly = searchParams.get('publishedOnly') === 'true';

    if (type !== null) {
      if (!isContentType(type)) return bad('Unknown content type');
      const items = await getItems(type, publishedOnly);
      return NextResponse.json({ success: true, type, count: items.length, data: items });
    }

    const allData = await readStore();
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

    const result = await validate(type, item, false);
    if (!result.ok) return result.response;
    const data = result.data;

    if (type === 'events') {
      const cross = eventCrossFieldErrors(data);
      if (Object.keys(cross).length) return bad(Object.values(cross)[0]!, 422, cross);
      data.seatsTaken = 0;
    } else {
      Object.assign(data, CONTENT_TYPES[type].createDefaults ?? {});
    }
    if (await slugTaken(type, data.slug)) return bad('This URL slug is already used', 409, { slug: 'This URL slug is already used' });

    const created = await addItem(type, data);
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

    const existing = (await getItems(type) as Record<string, unknown>[]).find((x) => x.id === id);
    if (!existing) return bad('Item not found', 404);

    // Only declared fields pass validation; id, createdAt and seatsTaken can never be set here.
    const result = await validate(type, updates, true, existing);
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
    if ('slug' in data && (await slugTaken(type, data.slug, id))) {
      return bad('This URL slug is already used', 409, { slug: 'This URL slug is already used' });
    }

    const updated = await updateItem(type, id, data);
    if (!updated) return bad('Item not found', 404);
    // Speakers, wings and content are linked by id in the database, so renames need no relinking.
    // Date / time / venue changes are emailed to registered attendees unless the admin opts out.
    let notified = 0;
    if (type === 'events' && body.notifyAttendees !== false) {
      notified = (await notifyEventUpdated(updated as CommunityEvent, eventChanges(existing as unknown as CommunityEvent, updated as CommunityEvent)));
    }
    return NextResponse.json({ success: true, item: updated, notified });
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
    if (type !== 'events' && !CONTENT_TYPES[type].allowDelete) return bad('Items in this collection cannot be deleted', 403);

    if (type === 'events') {
      // Bookings (even cancelled ones) keep their event for receipts, refunds and reports.
      const regs = await store.prisma.eventRegistration.count({ where: { eventId: id } });
      if (regs > 0) {
        return bad(
          `This event has ${regs} registration${regs === 1 ? '' : 's'} (including cancelled ones). Unpublish or cancel the event instead.`,
          409
        );
      }
    }

    if (type === 'wings') {
      const used = await wingUsage(id);
      if (used.length) {
        return bad(`This wing is linked to ${used.join(', ')}. Move them to another wing or unpublish the wing instead.`, 409);
      }
    }

    let deleted: boolean;
    try {
      // A speaker's event links are removed with it (ON DELETE CASCADE).
      deleted = await deleteItem(type, id);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2003') return bad('This item is still linked to other content. Unpublish it instead.', 409);
      throw err;
    }
    if (!deleted) return bad('Item not found', 404);

    return NextResponse.json({ success: true, deleted: true, id });
  } catch (error) {
    return serverError(error);
  }
}
