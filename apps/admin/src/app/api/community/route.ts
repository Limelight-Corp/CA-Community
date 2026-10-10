import { NextRequest, NextResponse } from 'next/server';
import { COMMUNITY_CONTENT_TYPES, type CommunityEvent } from '@ascend/shared';
import {
  readStore,
  writeStore,
  readPrivate,
  mutatePrivate,
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

function validate(type: ContentType, input: Record<string, unknown>, partial: boolean, existing?: Record<string, unknown>): Validated {
  const schema =
    type === 'events'
      ? partial
        ? eventUpdateSchema
        : eventBaseSchema
      : partial
        ? contentSchema(type, fieldOptions(type), existing).partial()
        : contentSchema(type, fieldOptions(type), existing);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = issuesToFieldErrors(parsed.error);
    return { ok: false, response: bad(Object.values(fieldErrors)[0] ?? 'Invalid data', 422, fieldErrors) };
  }
  const data = parsed.data as Record<string, unknown>;
  if (type === 'events') {
    const refs = eventReferenceErrors(
      data,
      { categories: adminTaxonomy('eventCategories'), wingNumbers: adminWings().map((w) => w.number) },
      existing as { category?: string; wingNumber?: number } | undefined
    );
    if (Object.keys(refs).length) return { ok: false, response: bad(Object.values(refs)[0]!, 422, refs) };
  }
  if (type === 'wings') {
    const clash = wingClash(data, typeof existing?.id === 'string' ? existing.id : undefined);
    if (clash) return { ok: false, response: bad(Object.values(clash)[0]!, 409, clash) };
  }
  return { ok: true, data };
}

/** Wing numbers and names must stay unique (events link by number; content links by name). */
function wingClash(data: Record<string, unknown>, exceptId?: string): Record<string, string> | null {
  const others = readStore().wings.filter((w) => w.id !== exceptId);
  if (data.number !== undefined && others.some((w) => w.number === Number(data.number))) {
    return { number: `Wing number ${data.number} is already used` };
  }
  const name = typeof data.name === 'string' ? data.name.trim().toLowerCase() : '';
  if (name && others.some((w) => w.name.trim().toLowerCase() === name)) return { name: 'Another wing already has this name' };
  return null;
}

/** Content that points at a wing: events by number; resources, team and jobs by name. */
function wingUsage(wing: { number: number; name: string }): string[] {
  const store = readStore();
  const same = (v?: string) => !!v && v.trim().toLowerCase() === wing.name.trim().toLowerCase();
  const parts: [number, string][] = [
    [store.events.filter((e) => e.wingNumber === wing.number).length, 'event'],
    [store.resources.filter((r) => same(r.wing)).length, 'resource'],
    [store.team.filter((t) => same(t.wing)).length, 'team profile'],
    [store.jobs.filter((j) => same(j.wing)).length, 'job post'],
  ];
  return parts.filter(([n]) => n > 0).map(([n, label]) => `${n} ${label}${n === 1 ? '' : 's'}`);
}

/** Events link to a wing by number: follow a renumbered wing. */
function renumberWingEvents(from: number, to: number): void {
  const store = readStore();
  let changed = false;
  for (const e of store.events) {
    if (e.wingNumber === from) {
      e.wingNumber = to;
      changed = true;
    }
  }
  if (changed) writeStore(store);
  // Member interests, mentors and mentorship requests also store wing numbers.
  const swap = (list: number[] | undefined) => list?.map((n) => (n === from ? to : n));
  mutatePrivate((d) => {
    for (const m of d.members) if (m.interests?.includes(from)) m.interests = swap(m.interests);
    for (const m of d.mentors) if (m.wings.includes(from)) m.wings = swap(m.wings)!;
    for (const r of d.mentorshipRequests) if (r.wings.includes(from)) r.wings = swap(r.wings)!;
  });
}

/** Follows a renamed wing in the content that links to it by name. */
function relinkWing(from: string, to: string): void {
  const store = readStore();
  const key = from.trim().toLowerCase();
  let changed = false;
  for (const list of [store.resources, store.team, store.jobs] as { wing?: string }[][]) {
    for (const item of list) {
      if (item.wing && item.wing.trim().toLowerCase() === key) {
        item.wing = to;
        changed = true;
      }
    }
  }
  if (changed) writeStore(store);
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
    const result = validate(type, updates, true, existing);
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
    if (type === 'wings' && typeof existing.name === 'string' && typeof data.name === 'string' && data.name !== existing.name) {
      relinkWing(existing.name, data.name);
    }
    if (type === 'wings' && typeof data.number === 'number' && data.number !== existing.number) {
      renumberWingEvents(Number(existing.number), data.number);
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

    if (type === 'wings') {
      const wing = readStore().wings.find((w) => w.id === id);
      const used = wing ? wingUsage(wing) : [];
      if (used.length) {
        return bad(`This wing is linked to ${used.join(', ')}. Move them to another wing or unpublish the wing instead.`, 409);
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
