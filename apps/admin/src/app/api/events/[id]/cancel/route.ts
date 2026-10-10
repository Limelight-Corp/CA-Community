import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { CommunityEvent } from '@ascend/shared';
import { getItems, updateItem } from '../../../../../lib/community-store';
import { notifyEventCancelled } from '../../../../../lib/notifications';
import { bad, handleError } from '../../../../../lib/api-helpers';

export const dynamic = 'force-dynamic';

const Body = z.object({ note: z.string().trim().max(600).optional() });

/** POST — cancels the event, closes registrations and emails everyone registered. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = Body.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return bad('The note must be under 600 characters', 422);
    const event = getItems<CommunityEvent>('events').find((e) => e.id === id);
    if (!event) return bad('Event not found', 404);
    if (event.cancelledAt) return bad('This event is already cancelled', 409);

    const note = parsed.data.note || undefined;
    const updated = updateItem('events', id, {
      cancelledAt: new Date().toISOString(),
      cancellationNote: note,
      registrationOpen: false,
    }) as CommunityEvent | null;
    if (!updated) return bad('Event not found', 404);
    const notified = notifyEventCancelled(updated, note);
    return NextResponse.json({ success: true, item: updated, notified });
  } catch (error) {
    return handleError(error, 'Cancel event');
  }
}

/** DELETE — undoes a cancellation (no emails; registrations stay closed until reopened). */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = getItems<CommunityEvent>('events').find((e) => e.id === id);
    if (!event) return bad('Event not found', 404);
    if (!event.cancelledAt) return bad('This event is not cancelled', 409);
    const updated = updateItem('events', id, { cancelledAt: undefined, cancellationNote: undefined });
    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return handleError(error, 'Restore event');
  }
}
