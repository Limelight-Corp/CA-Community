import Link from 'next/link';
import {
  CalendarDays,
  CalendarPlus,
  CircleCheck,
  Clock,
  IndianRupee,
  Inbox,
  Newspaper,
  Settings,
  Ticket,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { getDashboardData } from '../../../lib/admin-data';
import { getAnalytics } from '../../../lib/analytics';
import { ChartCard, ChartEmpty, LineChart } from '../../../components/charts/Charts';
import { InsightList } from '../../../components/charts/AnalyticsWidgets';
import { formatDate, formatDateTime, formatFee, formatINR } from '../../../lib/format';
import { PageHeader, Panel, PaymentChip, SeatBar, StatCard, PublishChip, Chip } from '../../../components/ui/Display';

export const dynamic = 'force-dynamic';

const QUICK_ACTIONS = [
  { href: '/events/new', label: 'Create event', icon: CalendarPlus },
  { href: '/content/news/new', label: 'Publish news', icon: Newspaper },
  { href: '/members?status=pending', label: 'Review applications', icon: UserCheck },
  { href: '/messages', label: 'Open inbox', icon: Inbox },
  { href: '/settings', label: 'Update banners', icon: Settings },
];

export default function DashboardPage() {
  const { kpis, recentRegistrations, upcomingEvents } = getDashboardData();
  const trend = getAnalytics('30');
  const hasTrend = trend.timeline.some((p) => p.registrations > 0 || p.paid > 0);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Command"
        accent="centre."
        description="Live figures from event registrations, payments, membership applications and the contact inbox."
        actions={
          <Link
            href="/events/new"
            className="inline-flex items-center gap-2 rounded-full bg-grad-primary px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            New event
          </Link>
        }
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue collected" value={formatINR(kpis.revenue)} tone="gold" icon={<IndianRupee />} hint="Paid registrations" href="/payments" />
        <StatCard label="Upcoming events" value={kpis.upcomingEvents} icon={<CalendarDays />} href="/events?when=upcoming" />
        <StatCard label="Registrations" value={kpis.totalRegistrations} icon={<Ticket />} hint="Excluding cancelled" href="/registrations" />
        <StatCard label="Paid" value={kpis.paid} tone="ok" icon={<CircleCheck />} href="/payments?payment=paid" />
        <StatCard label="Pending payment" value={kpis.pending} tone="warn" icon={<Clock />} href="/registrations?payment=pending" />
        <StatCard label="New applications" value={kpis.newMembers} tone={kpis.newMembers ? 'gold' : 'blue'} icon={<UserCheck />} hint="Awaiting review" href="/members?status=pending" />
        <StatCard label="Unread messages" value={kpis.unreadMessages} tone={kpis.unreadMessages ? 'warn' : 'blue'} icon={<Inbox />} href="/messages" />
        <div className="flex flex-col justify-between gap-3 rounded-token-lg border border-gold/25 bg-gold/[0.06] p-5">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-gold">Quick actions</span>
          <ul className="flex flex-col gap-1">
            {QUICK_ACTIONS.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="group flex items-center gap-2.5 rounded-lg py-1 text-[13.5px] font-medium text-[var(--fg)] hover:text-gold-soft">
                  <a.icon className="h-4 w-4 text-gold" aria-hidden />
                  {a.label}
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartCard
          title="Last 30 days"
          description="Daily registrations and paid bookings"
          legend={[
            { label: 'Registrations', color: 'var(--series-1)', shape: 'line' },
            { label: 'Paid', color: 'var(--series-2)', shape: 'line' },
          ]}
          table={{ columns: ['Day', 'Registrations', 'Paid'], rows: trend.timeline.map((p) => [p.label, p.registrations, p.paid]) }}
          actions={
            <Link href="/analytics" className="text-[13px] font-medium text-brand-200 hover:text-[var(--fg)]">
              Full analytics
            </Link>
          }
        >
          {hasTrend ? (
            <LineChart
              height={220}
              labels={trend.timeline.map((p) => p.label)}
              series={[
                { key: 'reg', label: 'Registrations', color: 'var(--series-1)', values: trend.timeline.map((p) => p.registrations), area: true },
                { key: 'paid', label: 'Paid', color: 'var(--series-2)', values: trend.timeline.map((p) => p.paid) },
              ]}
            />
          ) : (
            <ChartEmpty height={220}>No registrations in the last 30 days yet.</ChartEmpty>
          )}
        </ChartCard>
        <Panel title="Smart insights" description="What needs attention right now">
          <InsightList items={trend.insights.slice(0, 5)} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Panel
          title="Recent registrations"
          description="Latest bookings across all events"
          actions={
            <Link href="/registrations" className="text-[13px] font-medium text-brand-200 hover:text-[var(--fg)]">
              View all
            </Link>
          }
        >
          {recentRegistrations.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[var(--muted)]">No registrations yet. They appear here as soon as someone books an event.</p>
          ) : (
            <ul className="-my-2 divide-y divide-mist/[0.07]">
              {recentRegistrations.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[var(--fg)]">{r.name}</p>
                    <p className="truncate text-[12.5px] text-[var(--muted)]">
                      {r.eventTitle} · {formatDateTime(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[12.5px] tabular-nums text-[var(--fg)]">{formatFee(r.fee)}</span>
                    <PaymentChip status={r.paymentStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Upcoming events"
          description="Seat fill by event"
          actions={
            <Link href="/events" className="text-[13px] font-medium text-brand-200 hover:text-[var(--fg)]">
              All events
            </Link>
          }
        >
          {upcomingEvents.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-[var(--muted)]">No upcoming events scheduled.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}/registrations`}
                    className="group flex flex-col gap-3 rounded-2xl border border-mist/[0.08] bg-mist/[0.02] p-4 transition hover:border-brand-300/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[15.5px] font-medium text-[var(--fg)] group-hover:text-brand-100">{e.title}</p>
                        <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
                          {formatDate(e.date)} · {e.mode === 'Online' ? 'Online' : e.city || e.venue}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <PublishChip published={e.isPublished !== false} />
                        {e.registrationOpen === false && <Chip tone="bad">Closed</Chip>}
                      </div>
                    </div>
                    <SeatBar taken={Number(e.seatsTaken) || 0} total={Number(e.seatsTotal) || 0} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
