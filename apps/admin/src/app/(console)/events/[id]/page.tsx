import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { readStore } from '../../../../lib/community-store';
import { PageHeader } from '../../../../components/ui/Display';
import { EventForm } from '../../../../components/events/EventForm';

export const dynamic = 'force-dynamic';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = readStore();
  const event = store.events.find((e) => e.id === id);
  if (!event) notFound();
  const speakers = store.speakers.map((s) => ({ slug: s.slug, name: s.name, title: s.title }));
  return (
    <>
      <PageHeader
        eyebrow="Edit event"
        title={event.title}
        backHref="/events"
        backLabel="All events"
        actions={
          <Link
            href={`/events/${event.id}/registrations`}
            className="inline-flex items-center gap-2 rounded-full border border-mist/[0.16] bg-mist/[0.04] px-4 py-2.5 text-[13.5px] font-semibold text-[var(--fg)] hover:border-brand-300/50"
          >
            <BarChart3 className="h-4 w-4 text-brand-200" aria-hidden />
            Registrations dashboard
          </Link>
        }
      />
      <EventForm
        key={event.updatedAt ?? event.id}
        event={event}
        speakers={speakers}
        takenSlugs={store.events.filter((e) => e.id !== event.id).map((e) => e.slug)}
      />
    </>
  );
}
