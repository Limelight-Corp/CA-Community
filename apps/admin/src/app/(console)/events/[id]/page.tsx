import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { readPrivate, readStore } from '../../../../lib/community-store';
import { EventCancelControl } from '../../../../components/events/EventCancelControl';
import { adminTaxonomy, adminWings } from '../../../../lib/taxonomy';
import { PageHeader } from '../../../../components/ui/Display';
import { EventForm } from '../../../../components/events/EventForm';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = readStore();
  const event = store.events.find((e) => e.id === id);
  if (!event) notFound();
  const regs = readPrivate().registrations.filter((r) => r.eventId === event.id);
  const active = regs.filter((r) => r.status === 'confirmed' || r.status === 'pending_payment');
  const speakers = store.speakers.map((s) => ({ slug: s.slug, name: s.name, title: s.title }));
  return (
    <>
      <PageHeader
        eyebrow="Edit event"
        title={event.title}
        backHref="/events"
        backLabel="All events"
        actions={
          <div className="flex flex-wrap gap-2">
          <EventCancelControl
            eventId={event.id}
            title={event.title}
            cancelledAt={event.cancelledAt}
            activeRegistrations={active.length}
            paidRegistrations={active.filter((r) => r.paymentStatus === 'paid').length}
          />
          <Link
            href={`/events/${event.id}/registrations`}
            className="inline-flex items-center gap-2 rounded-full border border-mist/[0.16] bg-mist/[0.04] px-4 py-2.5 text-[13.5px] font-semibold text-[var(--fg)] hover:border-brand-300/50"
          >
            <BarChart3 className="h-4 w-4 text-brand-200" aria-hidden />
            Registrations dashboard
          </Link>
          </div>
        }
      />
      {event.cancelledAt && (
        <div role="status" className="mb-6 rounded-token-lg border border-bad/30 bg-bad/10 p-4 text-[14px] text-[var(--fg)]">
          <strong className="text-bad">Cancelled</strong> on{' '}
          {new Date(event.cancelledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}. The website shows
          this event as cancelled and registrations are closed.
          {event.cancellationNote ? ` Message: “${event.cancellationNote}”` : ''}
        </div>
      )}
      <EventForm
        key={event.updatedAt ?? event.id}
        event={event}
        speakers={speakers}
        categories={adminTaxonomy('eventCategories')}
        wings={adminWings().map((w) => ({ number: w.number, name: w.name }))}
        takenSlugs={store.events.filter((e) => e.id !== event.id).map((e) => e.slug)}
      />
    </>
  );
}
