import Link from 'next/link';
import { CalendarPlus } from 'lucide-react';
import type { CommunityEvent } from '@ascend/shared';
import { readPrivate, readStore } from '../../../lib/community-store';
import { eventStats } from '../../../lib/admin-data';
import { PageHeader } from '../../../components/ui/Display';
import { EventsTable, type EventRow } from '../../../components/events/EventsTable';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { events } = readStore();
  const regs = readPrivate().registrations;
  const rows: EventRow[] = [...events]
    .sort((a: CommunityEvent, b: CommunityEvent) => (b.date ?? '').localeCompare(a.date ?? ''))
    .map((e) => {
      const s = eventStats(e, regs);
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        date: e.date,
        time: e.time,
        city: e.city,
        venue: e.venue,
        mode: e.mode,
        category: e.category,
        fee: Number(e.fee) || 0,
        seatsTaken: s.seatsTaken,
        seatsTotal: s.seatsTotal,
        registrations: s.total,
        revenue: s.revenue,
        isPublished: e.isPublished !== false,
        registrationOpen: e.registrationOpen !== false,
        cancelled: !!e.cancelledAt,
        featured: Boolean(e.featured),
        imageUrl: e.imageUrl,
      };
    });

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Events &"
        accent="registrations."
        description="Create and edit events, open or close registrations, and open each event's management dashboard."
        actions={
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 rounded-full bg-grad-primary px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Create event
          </Link>
        }
      />
      <EventsTable rows={rows} initialStatus={sp.when ?? sp.status ?? ''} />
    </>
  );
}
