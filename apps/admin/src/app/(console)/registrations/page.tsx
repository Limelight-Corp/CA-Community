import { readPrivate, readStore } from '../../../lib/community-store';
import { publicRegistration } from '../../../lib/admin-data';
import { byNewest } from '../../../lib/filters';
import { PageHeader, Panel } from '../../../components/ui/Display';
import { RegistrationsTable } from '../../../components/registrations/RegistrationsTable';

export const dynamic = 'force-dynamic';

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = [...readPrivate().registrations].sort(byNewest).map(publicRegistration);
  const events = [...readStore().events]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .map((e) => ({ id: e.id, title: e.title }));
  return (
    <>
      <PageHeader
        eyebrow="Attendees"
        title="All"
        accent="registrations."
        description="Every booking across all events. Filter by event or payment status and export exactly what you see."
      />
      <Panel>
        <RegistrationsTable rows={rows} events={events} initial={{ q: sp.q, event: sp.event, payment: sp.payment, status: sp.status }} />
      </Panel>
    </>
  );
}
