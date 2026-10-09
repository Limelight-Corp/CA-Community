import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Armchair, CircleCheck, Clock, IndianRupee, Pencil, Ticket, UserRoundCheck } from 'lucide-react';
import { readPrivate, readStore } from '../../../../../lib/community-store';
import { eventStats, publicRegistration } from '../../../../../lib/admin-data';
import { byNewest } from '../../../../../lib/filters';
import { formatDate, formatFee, formatINR } from '../../../../../lib/format';
import { Chip, PageHeader, Panel, PublishChip, SeatBar, StatCard } from '../../../../../components/ui/Display';
import { RegistrationsTable } from '../../../../../components/registrations/RegistrationsTable';

export const dynamic = 'force-dynamic';

export default async function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = readStore().events.find((e) => e.id === id);
  if (!event) notFound();
  const all = readPrivate().registrations;
  const stats = eventStats(event, all);
  const rows = all.filter((r) => r.eventId === event.id).sort(byNewest).map(publicRegistration);

  return (
    <>
      <PageHeader
        eyebrow="Event management"
        title={event.title}
        backHref="/events"
        backLabel="All events"
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              {formatDate(event.date)} · {event.time}
              {event.endTime ? `–${event.endTime}` : ''} · {event.mode === 'Online' ? 'Online' : [event.venue, event.city].filter(Boolean).join(', ')} ·{' '}
              {formatFee(event.fee)}
            </span>
            <PublishChip published={event.isPublished !== false} />
            <Chip tone={event.registrationOpen === false ? 'bad' : 'ok'}>{event.registrationOpen === false ? 'Registrations closed' : 'Registrations open'}</Chip>
          </span>
        }
        actions={
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-mist/[0.16] bg-mist/[0.04] px-4 py-2.5 text-[13.5px] font-semibold text-[var(--fg)] hover:border-brand-300/50"
          >
            <Pencil className="h-4 w-4 text-brand-200" aria-hidden />
            Edit event
          </Link>
        }
      />

      <section aria-label="Event figures" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Registrations" value={stats.total} icon={<Ticket />} hint={`${stats.cancelled} cancelled`} />
        <StatCard label="Paid" value={stats.paid} tone="ok" icon={<CircleCheck />} />
        <StatCard label="Pending" value={stats.pending} tone="warn" icon={<Clock />} />
        <StatCard label="Seats available" value={stats.seatsAvailable} icon={<Armchair />} hint={`${stats.seatsTaken} of ${stats.seatsTotal} taken`} />
        <StatCard label="Attended" value={stats.attended} icon={<UserRoundCheck />} hint={stats.confirmed ? `${Math.round((stats.attended / stats.confirmed) * 100)}% of confirmed` : undefined} />
        <StatCard label="Event revenue" value={formatINR(stats.revenue)} tone="gold" icon={<IndianRupee />} />
      </section>

      <Panel title="Seat capacity">
        <SeatBar taken={stats.seatsTaken} total={stats.seatsTotal} />
      </Panel>

      <Panel title="Attendees" description="Mark attendance, record offline payments, cancel bookings and export the list.">
        <RegistrationsTable rows={rows} fixedEventId={event.id} />
      </Panel>
    </>
  );
}
