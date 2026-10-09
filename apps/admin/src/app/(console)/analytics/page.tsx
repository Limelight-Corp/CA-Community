import type { Metadata } from 'next';
import { getAnalytics, parseRange, RANGE_OPTIONS } from '../../../lib/analytics';
import { PageHeader, Panel } from '../../../components/ui/Display';
import {
  ChartCard,
  ChartEmpty,
  ColumnChart,
  Funnel,
  HBarChart,
  Heatmap,
  LineChart,
  RadialGauge,
  SeatFillList,
  StatusMix,
} from '../../../components/charts/Charts';
import { ActivityFeed, AnalyticsToolbar, InsightList, KpiTile } from '../../../components/charts/AnalyticsWidgets';

export const dynamic = 'force-dynamic';

function withoutKey<T extends { key: string }>({ key: _key, ...rest }: T): Omit<T, 'key'> {
  return rest;
}
export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const data = getAnalytics(parseRange(range));
  const period = data.range.label;
  const labels = data.timeline.map((p) => p.label);
  const bucketWord = data.range.bucketDays === 1 ? 'day' : data.range.bucketDays === 7 ? 'week' : 'month';
  const hasRegs = data.timeline.some((p) => p.registrations > 0 || p.paid > 0);
  const hasRevenue = data.timeline.some((p) => p.revenue > 0);
  const [heroKpi, ...restKpis] = data.kpis;

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="The community"
        accent="pulse."
        description={`Registrations, payments, seats and members for the last ${period} (${data.range.from} → ${data.range.to}, IST), compared with the previous ${period}.`}
      />

      <AnalyticsToolbar ranges={RANGE_OPTIONS} current={data.range.key} />

      {/* KPIs */}
      <section aria-label="Key figures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {heroKpi && <KpiTile {...withoutKey(heroKpi)} periodLabel={period} hero />}
        {restKpis.map((k) => (
          <KpiTile key={k.key} {...withoutKey(k)} periodLabel={period} />
        ))}
      </section>

      {/* Trend + insights */}
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Registrations & paid bookings"
          description={`Per ${bucketWord}. Paid counts the day payment was confirmed.`}
          legend={[
            { label: 'Registrations', color: 'var(--series-1)', shape: 'line' },
            { label: 'Paid', color: 'var(--series-2)', shape: 'line' },
          ]}
          table={{ columns: ['Period', 'Registrations', 'Paid'], rows: data.timeline.map((p) => [p.label, p.registrations, p.paid]) }}
        >
          {hasRegs ? (
            <LineChart
              labels={labels}
              series={[
                { key: 'reg', label: 'Registrations', color: 'var(--series-1)', values: data.timeline.map((p) => p.registrations), area: true },
                { key: 'paid', label: 'Paid', color: 'var(--series-2)', values: data.timeline.map((p) => p.paid) },
              ]}
            />
          ) : (
            <ChartEmpty height={260}>No registrations in the last {period}. The trend line appears with the first booking.</ChartEmpty>
          )}
        </ChartCard>

        <Panel title="Smart insights" description="Auto-generated from the figures on this page">
          <div className="-mr-2 max-h-[360px] overflow-y-auto pr-2">
            <InsightList items={data.insights} />
          </div>
        </Panel>
      </div>

      {/* Revenue + payment mix */}
      <div className="grid gap-4 xl:grid-cols-5">
        <ChartCard
          className="xl:col-span-3"
          title="Revenue collected"
          description={`Confirmed online and recorded offline payments, per ${bucketWord}`}
          table={{ columns: ['Period', 'Revenue (₹)'], rows: data.timeline.map((p) => [p.label, p.revenue.toLocaleString('en-IN')]) }}
        >
          {hasRevenue ? (
            <ColumnChart labels={labels} values={data.timeline.map((p) => p.revenue)} format="inr" seriesLabel="Revenue" color="var(--series-1)" />
          ) : (
            <ChartEmpty height={240}>No payments recorded in the last {period}.</ChartEmpty>
          )}
        </ChartCard>
        <ChartCard
          className="xl:col-span-2"
          title="Payment status"
          description="Registrations made in this period"
          table={{ columns: ['Status', 'Registrations'], rows: data.paymentMix.map((d) => [d.label, d.value]) }}
        >
          <StatusMix data={data.paymentMix} />
        </ChartCard>
      </div>

      {/* Funnel + seats */}
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Registration funnel"
          description="From sign-up to showing up"
          table={{ columns: ['Stage', 'Registrations'], rows: data.funnel.map((d) => [d.label, d.value]) }}
        >
          <Funnel data={data.funnel} />
        </ChartCard>
        <ChartCard
          title="Seat utilisation"
          description="All upcoming published events"
          table={{ columns: ['Measure', 'Seats'], rows: [['Taken', data.utilisation.taken], ['Capacity', data.utilisation.total], ['Available', data.utilisation.total - data.utilisation.taken]] }}
        >
          {data.utilisation.total > 0 ? (
            <RadialGauge
              value={data.utilisation.taken}
              total={data.utilisation.total}
              label="of seats taken"
              sublabel={`${data.utilisation.taken.toLocaleString('en-IN')} / ${data.utilisation.total.toLocaleString('en-IN')}`}
            />
          ) : (
            <ChartEmpty>No upcoming events with capacity.</ChartEmpty>
          )}
        </ChartCard>
        <ChartCard
          title="Seat fill by event"
          description="Fullest first · amber ≥ 80%, red = sold out"
          table={{ columns: ['Event', 'Taken', 'Capacity', 'Fill'], rows: data.seatFill.map((e) => [e.title, e.taken, e.total, `${Math.round((e.taken / e.total) * 100)}%`]) }}
        >
          <SeatFillList data={data.seatFill} />
        </ChartCard>
      </div>

      {/* Heatmap */}
      <ChartCard
        title="When do people register?"
        description="Registrations by weekday and hour (IST) — plan announcements and reminders around the hot spots"
        table={{
          columns: ['Weekday', ...Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}h`)],
          rows: data.heatmap.map((row, d) => [['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d]!, ...row]),
        }}
      >
        <Heatmap grid={data.heatmap} />
      </ChartCard>

      {/* Breakdowns */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ChartCard title="Top cities" description="Registrations by attendee city" table={{ columns: ['City', 'Registrations'], rows: data.byCity.map((d) => [d.label, d.value]) }}>
          {data.byCity.length ? <HBarChart data={data.byCity} seriesLabel="Registrations by city" /> : <ChartEmpty height={180}>No data yet.</ChartEmpty>}
        </ChartCard>
        <ChartCard title="Event types" description="Registrations by category" table={{ columns: ['Category', 'Registrations'], rows: data.byCategory.map((d) => [d.label, d.value]) }}>
          {data.byCategory.length ? <HBarChart data={data.byCategory} seriesLabel="Registrations by category" /> : <ChartEmpty height={180}>No data yet.</ChartEmpty>}
        </ChartCard>
        <ChartCard title="Wings" description="Registrations by organising wing" table={{ columns: ['Wing', 'Registrations'], rows: data.byWing.map((d) => [d.label, d.value]) }}>
          {data.byWing.length ? <HBarChart data={data.byWing} seriesLabel="Registrations by wing" useEntityColor /> : <ChartEmpty height={180}>No data yet.</ChartEmpty>}
        </ChartCard>
        <ChartCard title="Membership plans" description="Applications in this period" table={{ columns: ['Plan', 'Applications'], rows: data.byPlan.map((d) => [d.label, d.value]) }}>
          {data.byPlan.some((d) => d.value > 0) ? <HBarChart data={data.byPlan} seriesLabel="Applications by plan" /> : <ChartEmpty height={180}>No applications yet.</ChartEmpty>}
        </ChartCard>
      </div>

      <Panel title="Live activity" description="Latest registrations, payments, applications and messages">
        <ActivityFeed items={data.activity} />
      </Panel>
    </>
  );
}
