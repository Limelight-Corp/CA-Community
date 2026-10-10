import { CircleCheck, Clock, Users, CircleX } from 'lucide-react';
import { getSettings, readPrivate } from '../../../lib/community-store';
import { byNewest } from '../../../lib/filters';
import { PageHeader, Panel, StatCard } from '../../../components/ui/Display';
import { adminWings } from '../../../lib/taxonomy';
import { MembersManager } from '../../../components/members/MembersManager';

export const dynamic = 'force-dynamic';

export default async function MembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = [...readPrivate().members].sort(byNewest);
  const count = (s: string) => rows.filter((m) => m.status === s).length;
  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="Membership"
        accent="applications."
        description="Review, approve or reject applications, correct member details and export the member database."
      />
      <section aria-label="Membership summary" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All applications" value={rows.length} icon={<Users />} />
        <StatCard label="Awaiting review" value={count('pending')} tone={count('pending') ? 'gold' : 'blue'} icon={<Clock />} />
        <StatCard label="Approved" value={count('approved')} tone="ok" icon={<CircleCheck />} />
        <StatCard label="Rejected" value={count('rejected')} tone="bad" icon={<CircleX />} />
      </section>
      <Panel>
        <MembersManager rows={rows} initial={{ q: sp.q, plan: sp.plan, status: sp.status, city: sp.city }} fees={getSettings().membershipFees}
          wingNames={Object.fromEntries(adminWings().map((w) => [w.number, w.name]))}
        />
      </Panel>
    </>
  );
}
