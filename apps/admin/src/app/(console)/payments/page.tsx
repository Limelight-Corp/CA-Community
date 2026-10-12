import { BadgeCheck, CircleCheck, CircleX, Clock, RotateCcw } from 'lucide-react';
import { MEMBERSHIP_PLANS } from '@ascend/shared';
import { readPrivate, readStore } from '../../../lib/community-store';
import { publicRegistration } from '../../../lib/admin-data';
import { byNewest, paymentRows } from '../../../lib/filters';
import { formatDateTime, formatINR } from '../../../lib/format';
import { DataTable, EmptyRow, PageHeader, Panel, StatCard } from '../../../components/ui/Display';
import { ExportButtons } from '../../../components/ui/Controls';
import { razorpayConfigured } from '../../../lib/razorpay';
import { PaymentsTable } from '../../../components/payments/PaymentsTable';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const priv = await readPrivate();
  const rows = paymentRows(priv.registrations).sort(byNewest);
  // Membership fees (online or recorded offline), newest first.
  const memberPayments = priv.members
    .flatMap((m) => (m.payments ?? []).map((p) => ({ member: m, payment: p })))
    .sort((a, b) => b.payment.paidAt.localeCompare(a.payment.paidAt));
  const memberTotal = memberPayments.reduce((s, r) => s + r.payment.amount, 0);
  const planName = (key: string) => MEMBERSHIP_PLANS.find((p) => p.key === key)?.name ?? key;
  const sum = (status: string) => rows.filter((r) => r.paymentStatus === status).reduce((s, r) => s + (Number(r.fee) || 0), 0);
  const count = (status: string) => rows.filter((r) => r.paymentStatus === status).length;
  const events = [...(await readStore()).events]
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
        <PaymentsTable rows={rows.map(publicRegistration)} events={events} initial={{ q: sp.q, event: sp.event, payment: sp.payment }} gatewayRefunds={razorpayConfigured()} />
      </Panel>
      <Panel
        title={<span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-ok" aria-hidden />Membership payments</span>}
        description={`${memberPayments.length} payments · ${formatINR(memberTotal)} received. The latest 25 are shown; the report has all of them.`}
        actions={<ExportButtons dataset="membership-payments" label="Download membership payment report" />}
      >
        <DataTable label="Membership payments">
          <thead>
            <tr>
              <th scope="col">Receipt</th>
              <th scope="col">Member</th>
              <th scope="col">Plan</th>
              <th scope="col">Amount</th>
              <th scope="col">Method</th>
              <th scope="col">Paid at</th>
              <th scope="col">Valid until</th>
            </tr>
          </thead>
          <tbody>
            {memberPayments.length === 0 && <EmptyRow colSpan={7}>No membership payments yet.</EmptyRow>}
            {memberPayments.slice(0, 25).map(({ member, payment }) => (
              <tr key={payment.id}>
                <td className="font-mono text-[12.5px]">{payment.id}</td>
                <td>
                  <div className="font-medium text-[var(--fg)]">{member.name}</div>
                  <div className="text-[12px] text-[var(--muted)]">{member.email}</div>
                </td>
                <td>{planName(member.plan)}</td>
                <td className="font-medium">{formatINR(payment.amount)}</td>
                <td>
                  {payment.method === 'razorpay' ? 'Online' : 'Offline'}
                  {payment.gatewayPaymentId && <div className="font-mono text-[11.5px] text-[var(--muted)]">{payment.gatewayPaymentId}</div>}
                </td>
                <td>{formatDateTime(payment.paidAt)}</td>
                <td>{payment.validUntil.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </Panel>
    </>
  );
}
