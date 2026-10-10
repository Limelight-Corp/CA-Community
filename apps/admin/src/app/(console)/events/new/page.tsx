import { readStore } from '../../../../lib/community-store';
import { adminTaxonomy, adminWings } from '../../../../lib/taxonomy';
import { PageHeader } from '../../../../components/ui/Display';
import { EventForm } from '../../../../components/events/EventForm';

export const dynamic = 'force-dynamic';

export default function NewEventPage() {
  const store = readStore();
  const speakers = store.speakers.map((s) => ({ slug: s.slug, name: s.name, title: s.title }));
  return (
    <>
      <PageHeader eyebrow="Events" title="Create" accent="event." backHref="/events" backLabel="All events" description="Fill in the details below. Keep it as a draft until everything is ready, then publish." />
      <EventForm speakers={speakers} categories={adminTaxonomy('eventCategories')} wings={adminWings().map((w) => ({ number: w.number, name: w.name }))} takenSlugs={store.events.map((e) => e.slug)} />
    </>
  );
}
