import { BadgeCheck, CircleCheck, CircleX, Clock, RotateCcw } from 'lucide-react';
import { MEMBERSHIP_PLANS } from '@ascend/shared';
import { readPrivate, readStore } from '../../../lib/community-store';
import { publicRegistration } from '../../../lib/admin-data';
import { byNewest, paymentRows } from '../../../lib/filters';
import { formatINR } from '../../../lib/format';
import { PageHeader, Panel, StatCard } from '../../../components/ui/Display';
import { ExportButtons } from '../../../components/ui/Controls';
import { razorpayConfigured } from '../../../lib/razorpay';
import { PaymentsTable } from '../../../components/payments/PaymentsTable';
import { MembershipPaymentsTable } from '../../../components/payments/MembershipPaymentsTable';

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
        description={`${memberPayments.length} payments · ${formatINR(memberTotal)} received.`}
        actions={<ExportButtons dataset="membership-payments" label="Download membership payment report" />}
      >
        <MembershipPaymentsTable
          rows={memberPayments.map(({ member, payment }) => ({
            receipt: payment.id,
            name: member.name,
            email: member.email,
            plan: planName(member.plan),
            amount: payment.amount,
            method: payment.method,
            gatewayPaymentId: payment.gatewayPaymentId,
            paidAt: payment.paidAt,
            validUntil: payment.validUntil,
          }))}
        />
      </Panel>
    </>
  );
}
