import { CircleCheck, CircleX, Clock, RotateCcw } from 'lucide-react';
import { readPrivate, readStore } from '../../../lib/community-store';
import { publicRegistration } from '../../../lib/admin-data';
import { byNewest, paymentRows } from '../../../lib/filters';
import { formatINR } from '../../../lib/format';
import { PageHeader, Panel, StatCard } from '../../../components/ui/Display';
import { PaymentsTable } from '../../../components/payments/PaymentsTable';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const rows = paymentRows(readPrivate().registrations).sort(byNewest);
  const sum = (status: string) => rows.filter((r) => r.paymentStatus === status).reduce((s, r) => s + (Number(r.fee) || 0), 0);
  const count = (status: string) => rows.filter((r) => r.paymentStatus === status).length;
  const events = [...readStore().events]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .map((e) => ({ id: e.id, title: e.title }));

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="Payment"
        accent="status."
        description="Every paid-event transaction with its gateway reference. Record offline payments and refunds, and download the payment report."
      />
      <section aria-label="Payment summary" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Successful" value={formatINR(sum('paid'))} tone="gold" icon={<CircleCheck />} hint={`${count('paid')} payments`} />
        <StatCard label="Pending" value={formatINR(sum('pending'))} tone="warn" icon={<Clock />} hint={`${count('pending')} awaiting payment`} />
        <StatCard label="Failed" value={formatINR(sum('failed'))} tone="bad" icon={<CircleX />} hint={`${count('failed')} attempts`} />
        <StatCard label="Refunded" value={formatINR(sum('refunded'))} tone="mute" icon={<RotateCcw />} hint={`${count('refunded')} refunds`} />
      </section>
      <Panel>
        <PaymentsTable rows={rows.map(publicRegistration)} events={events} initial={{ q: sp.q, event: sp.event, payment: sp.payment }} />
      </Panel>
    </>
  );
}
