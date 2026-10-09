/**
 * Server-only analytics over the file store (registrations, members, messages, events).
 * Every figure is derived from stored records — nothing is estimated or invented.
 * Dates are bucketed in IST (UTC+05:30), the community's operating timezone.
 */
import type {
  CommunityContactMessage,
  CommunityEvent,
  CommunityMemberApplication,
  CommunityRegistration,
  CommunityWing,
} from '@ascend/shared';
import { MEMBERSHIP_PLANS } from '@ascend/shared';
import { readPrivate, readStore } from './community-store';
import { isUpcoming, registrationRevenue } from './admin-data';

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 86_400_000;

export const RANGE_OPTIONS = [
  { key: '7', label: '7 days', days: 7 },
  { key: '30', label: '30 days', days: 30 },
  { key: '90', label: '90 days', days: 90 },
  { key: '365', label: '12 months', days: 365 },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]['key'];

export function parseRange(value: string | undefined): RangeKey {
  return (RANGE_OPTIONS.find((r) => r.key === value)?.key ?? '30') as RangeKey;
}

/** IST calendar day (YYYY-MM-DD) for an ISO timestamp. */
function istDay(iso: string): string {
  return new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function istParts(iso: string) {
  const d = new Date(new Date(iso).getTime() + IST_OFFSET_MS);
  return { weekday: (d.getUTCDay() + 6) % 7 /* Mon=0 */, hour: d.getUTCHours() };
}

function todayIst(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function addDays(day: string, n: number): string {
  return new Date(new Date(`${day}T00:00:00Z`).getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export interface Bucket {
  /** First day of the bucket (YYYY-MM-DD). */
  start: string;
  label: string;
}

export interface TimePoint {
  start: string;
  label: string;
  registrations: number;
  paid: number;
  revenue: number;
  members: number;
}

function buildBuckets(fromDay: string, toDay: string, stepDays: number): Bucket[] {
  const out: Bucket[] = [];
  for (let d = fromDay; d <= toDay; d = addDays(d, stepDays)) {
    const date = new Date(`${d}T00:00:00Z`);
    out.push({
      start: d,
      label:
        stepDays >= 28
          ? date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' })
          : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    });
  }
  return out;
}

function bucketIndex(buckets: Bucket[], day: string): number {
  if (!buckets.length || day < buckets[0]!.start) return -1;
  let idx = -1;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i]!.start <= day) idx = i;
    else break;
  }
  return idx;
}

export interface Kpi {
  key: string;
  label: string;
  value: number;
  previous: number;
  format: 'number' | 'inr' | 'percent';
  trend: number[];
  /** Whether an increase is good news (drives delta colour). */
  upIsGood: boolean;
  href?: string;
}

export interface Insight {
  tone: 'ok' | 'warn' | 'bad' | 'info';
  title: string;
  detail: string;
  href?: string;
}

export interface CategoryDatum {
  key: string;
  label: string;
  value: number;
  /** Entity colour (wings) — otherwise the chart assigns categorical slots. */
  color?: string;
}

export interface SeatFillDatum {
  id: string;
  title: string;
  date: string;
  taken: number;
  total: number;
}

export interface ActivityItem {
  at: string;
  kind: 'registration' | 'payment' | 'member' | 'message';
  title: string;
  detail: string;
  href: string;
}

export interface AnalyticsData {
  range: { key: RangeKey; label: string; from: string; to: string; bucketDays: number };
  kpis: Kpi[];
  timeline: TimePoint[];
  paymentMix: CategoryDatum[];
  funnel: CategoryDatum[];
  seatFill: SeatFillDatum[];
  utilisation: { taken: number; total: number };
  byCity: CategoryDatum[];
  byCategory: CategoryDatum[];
  byWing: CategoryDatum[];
  byPlan: CategoryDatum[];
  heatmap: number[][];
  insights: Insight[];
  activity: ActivityItem[];
  totals: { registrations: number; members: number; messages: number };
}

function countBy<T>(rows: T[], key: (row: T) => string | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (key(r) || '').trim();
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function topN(map: Map<string, number>, n: number, otherLabel = 'Other'): CategoryDatum[] {
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  const head = sorted.slice(0, n).map(([label, value]) => ({ key: label, label, value }));
  const rest = sorted.slice(n).reduce((s, [, v]) => s + v, 0);
  return rest > 0 ? [...head, { key: '__other', label: otherLabel, value: rest }] : head;
}

function inRange(iso: string, from: string, to: string): boolean {
  const d = istDay(iso);
  return d >= from && d <= to;
}

function conversion(rows: CommunityRegistration[]): number {
  const paidEvents = rows.filter((r) => Number(r.fee) > 0 && r.status !== 'cancelled');
  if (!paidEvents.length) return 0;
  return Math.round((paidEvents.filter((r) => r.paymentStatus === 'paid').length / paidEvents.length) * 100);
}

export function getAnalytics(rangeKey: RangeKey): AnalyticsData {
  const store = readStore();
  const priv = readPrivate();
  const option = RANGE_OPTIONS.find((r) => r.key === rangeKey)!;

  const to = todayIst();
  const from = addDays(to, -(option.days - 1));
  const prevTo = addDays(from, -1);
  const prevFrom = addDays(prevTo, -(option.days - 1));
  const bucketDays = option.days <= 31 ? 1 : option.days <= 120 ? 7 : 30;
  const buckets = buildBuckets(from, to, bucketDays);

  const regs = priv.registrations;
  const members = priv.members;
  const messages = priv.messages;

  const regsNow = regs.filter((r) => inRange(r.createdAt, from, to));
  const regsPrev = regs.filter((r) => inRange(r.createdAt, prevFrom, prevTo));
  const activeNow = regsNow.filter((r) => r.status !== 'cancelled');
  const activePrev = regsPrev.filter((r) => r.status !== 'cancelled');
  const membersNow = members.filter((m) => inRange(m.createdAt, from, to));
  const membersPrev = members.filter((m) => inRange(m.createdAt, prevFrom, prevTo));

  // Timeline
  const timeline: TimePoint[] = buckets.map((b) => ({ ...b, registrations: 0, paid: 0, revenue: 0, members: 0 }));
  for (const r of activeNow) {
    const i = bucketIndex(buckets, istDay(r.createdAt));
    if (i >= 0) timeline[i]!.registrations++;
  }
  for (const r of regs) {
    if (r.paymentStatus !== 'paid') continue;
    const when = r.paidAt || r.updatedAt || r.createdAt;
    if (!inRange(when, from, to)) continue;
    const i = bucketIndex(buckets, istDay(when));
    if (i >= 0) {
      timeline[i]!.paid++;
      timeline[i]!.revenue += Number(r.fee) || 0;
    }
  }
  for (const m of membersNow) {
    const i = bucketIndex(buckets, istDay(m.createdAt));
    if (i >= 0) timeline[i]!.members++;
  }

  const paidInRange = (rows: CommunityRegistration[], f: string, t: string) =>
    rows.filter((r) => r.paymentStatus === 'paid' && inRange(r.paidAt || r.updatedAt || r.createdAt, f, t));
  const revenueNow = registrationRevenue(paidInRange(regs, from, to));
  const revenuePrev = registrationRevenue(paidInRange(regs, prevFrom, prevTo));
  const paidNow = paidInRange(regs, from, to).length;
  const avgTicketNow = paidNow ? Math.round(revenueNow / paidNow) : 0;
  const paidPrevRows = paidInRange(regs, prevFrom, prevTo);
  const avgTicketPrev = paidPrevRows.length ? Math.round(revenuePrev / paidPrevRows.length) : 0;

  const trendOf = (field: keyof Pick<TimePoint, 'registrations' | 'revenue' | 'members' | 'paid'>) =>
    timeline.slice(-12).map((p) => p[field]);

  const kpis: Kpi[] = [
    { key: 'registrations', label: 'Registrations', value: activeNow.length, previous: activePrev.length, format: 'number', trend: trendOf('registrations'), upIsGood: true, href: '/registrations' },
    { key: 'revenue', label: 'Revenue collected', value: revenueNow, previous: revenuePrev, format: 'inr', trend: trendOf('revenue'), upIsGood: true, href: '/payments?payment=paid' },
    { key: 'conversion', label: 'Payment conversion', value: conversion(regsNow), previous: conversion(regsPrev), format: 'percent', trend: [], upIsGood: true, href: '/payments' },
    { key: 'ticket', label: 'Average ticket', value: avgTicketNow, previous: avgTicketPrev, format: 'inr', trend: [], upIsGood: true },
    { key: 'members', label: 'Member applications', value: membersNow.length, previous: membersPrev.length, format: 'number', trend: trendOf('members'), upIsGood: true, href: '/members' },
    {
      key: 'messages',
      label: 'Messages received',
      value: messages.filter((m) => inRange(m.createdAt, from, to)).length,
      previous: messages.filter((m) => inRange(m.createdAt, prevFrom, prevTo)).length,
      format: 'number',
      trend: [],
      upIsGood: true,
      href: '/messages',
    },
  ];

  // Payment mix (status — reserved status colours in the chart)
  const paymentMix: CategoryDatum[] = [
    { key: 'paid', label: 'Paid', value: regsNow.filter((r) => r.paymentStatus === 'paid').length },
    { key: 'pending', label: 'Pending', value: regsNow.filter((r) => r.paymentStatus === 'pending').length },
    { key: 'failed', label: 'Failed', value: regsNow.filter((r) => r.paymentStatus === 'failed').length },
    { key: 'refunded', label: 'Refunded', value: regsNow.filter((r) => r.paymentStatus === 'refunded').length },
    { key: 'not_required', label: 'Free', value: regsNow.filter((r) => r.paymentStatus === 'not_required').length },
  ];

  // Funnel
  const funnel: CategoryDatum[] = [
    { key: 'registered', label: 'Registered', value: regsNow.length },
    { key: 'active', label: 'Not cancelled', value: activeNow.length },
    { key: 'confirmed', label: 'Confirmed', value: regsNow.filter((r) => r.status === 'confirmed').length },
    { key: 'attended', label: 'Attended', value: regsNow.filter((r) => r.attended).length },
  ];

  // Seat fill — upcoming published events
  const upcomingEvents = store.events.filter((e) => e.isPublished !== false && isUpcoming(e));
  const seatFill: SeatFillDatum[] = upcomingEvents
    .map((e) => ({ id: e.id, title: e.title, date: e.date, taken: Number(e.seatsTaken) || 0, total: Number(e.seatsTotal) || 0 }))
    .filter((e) => e.total > 0)
    .sort((a, b) => b.taken / b.total - a.taken / a.total);
  const utilisation = seatFill.reduce((acc, e) => ({ taken: acc.taken + e.taken, total: acc.total + e.total }), { taken: 0, total: 0 });

  // Breakdowns
  const eventById = new Map(store.events.map((e) => [e.id, e] as const));
  const byCity = topN(countBy(activeNow, (r) => r.city && r.city.replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())), 7);
  const byCategory = topN(countBy(activeNow, (r) => eventById.get(r.eventId)?.category), 6);
  const wings = store.wings as CommunityWing[];
  const wingCounts = countBy(activeNow, (r) => {
    const e = eventById.get(r.eventId) as CommunityEvent | undefined;
    return e ? String(e.wingNumber) : undefined;
  });
  const byWing: CategoryDatum[] = [...wingCounts.entries()]
    .map(([num, value]) => {
      const w = wings.find((x) => String(x.number) === num);
      return { key: num, label: w ? `${String(w.number).padStart(2, '0')} · ${w.name}` : `Wing ${num}`, value, color: w?.color };
    })
    .sort((a, b) => b.value - a.value);
  const byPlan: CategoryDatum[] = MEMBERSHIP_PLANS.map((p) => ({
    key: p.key,
    label: p.name,
    value: membersNow.filter((m: CommunityMemberApplication) => m.plan === p.key).length,
  }));

  // Heatmap weekday × hour (IST)
  const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const r of activeNow) {
    const { weekday, hour } = istParts(r.createdAt);
    heatmap[weekday]![hour]!++;
  }

  // Insights — rules over the figures above
  const insights: Insight[] = [];
  const delta = (now: number, prev: number) => (prev > 0 ? Math.round(((now - prev) / prev) * 100) : null);
  const regDelta = delta(activeNow.length, activePrev.length);
  if (activeNow.length === 0) {
    insights.push({ tone: 'info', title: 'No registrations in this period', detail: `Nothing was registered in the last ${option.label}. Share an event link or feature an event on the homepage.`, href: '/events' });
  } else if (regDelta !== null) {
    insights.push({
      tone: regDelta >= 0 ? 'ok' : 'warn',
      title: `Registrations ${regDelta >= 0 ? 'up' : 'down'} ${Math.abs(regDelta)}%`,
      detail: `${activeNow.length} this period vs ${activePrev.length} in the previous ${option.label}.`,
      href: '/registrations',
    });
  }
  const failed = regsNow.filter((r) => r.paymentStatus === 'failed').length;
  if (failed > 0) insights.push({ tone: 'bad', title: `${failed} failed payment${failed > 1 ? 's' : ''}`, detail: 'These registrants may need a nudge to retry payment.', href: '/payments?payment=failed' });
  const pending = regsNow.filter((r) => r.paymentStatus === 'pending').length;
  if (pending > 0) insights.push({ tone: 'warn', title: `${pending} payment${pending > 1 ? 's' : ''} pending`, detail: 'Seats are only counted once payment is confirmed.', href: '/registrations?payment=pending' });
  const nearlyFull = seatFill.filter((e) => e.taken / e.total >= 0.8 && e.taken < e.total);
  for (const e of nearlyFull.slice(0, 2)) {
    insights.push({ tone: 'ok', title: `${e.title} is ${Math.round((e.taken / e.total) * 100)}% full`, detail: `${e.total - e.taken} seats left — consider a waitlist or a larger venue.`, href: `/events/${e.id}/registrations` });
  }
  const soldOut = seatFill.filter((e) => e.taken >= e.total);
  if (soldOut.length) insights.push({ tone: 'info', title: `${soldOut.length} event${soldOut.length > 1 ? 's' : ''} sold out`, detail: soldOut.map((e) => e.title).join(', '), href: '/events' });
  const lowFill = seatFill.filter((e) => e.taken / e.total < 0.25);
  if (lowFill.length) insights.push({ tone: 'warn', title: `${lowFill.length} upcoming event${lowFill.length > 1 ? 's' : ''} under 25% full`, detail: lowFill.slice(0, 3).map((e) => e.title).join(', '), href: '/events' });
  if (byCity.length && byCity[0]!.key !== '__other' && activeNow.length) {
    insights.push({ tone: 'info', title: `Top city: ${byCity[0]!.label}`, detail: `${Math.round((byCity[0]!.value / activeNow.length) * 100)}% of registrations this period.` });
  }
  let peak = { weekday: -1, hour: -1, value: 0 };
  heatmap.forEach((row, d) => row.forEach((v, h) => { if (v > peak.value) peak = { weekday: d, hour: h, value: v }; }));
  if (peak.value > 1) {
    const day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][peak.weekday];
    insights.push({ tone: 'info', title: `Peak sign-ups: ${day}s around ${String(peak.hour).padStart(2, '0')}:00`, detail: 'Schedule announcements and reminders just before this window.' });
  }
  const pendingMembers = members.filter((m) => m.status === 'pending').length;
  if (pendingMembers) insights.push({ tone: 'warn', title: `${pendingMembers} member application${pendingMembers > 1 ? 's' : ''} awaiting review`, detail: 'Approve or reject to keep the queue moving.', href: '/members?status=pending' });
  const unread = messages.filter((m: CommunityContactMessage) => m.status === 'new').length;
  if (unread) insights.push({ tone: 'warn', title: `${unread} unread message${unread > 1 ? 's' : ''}`, detail: 'Contact form submissions waiting for a reply.', href: '/messages' });

  // Activity feed
  const activity: ActivityItem[] = [
    ...regs.map((r) => ({ at: r.createdAt, kind: 'registration' as const, title: `${r.name} registered`, detail: r.eventTitle, href: `/events/${r.eventId}/registrations` })),
    ...regs.filter((r) => r.paymentStatus === 'paid' && r.paidAt).map((r) => ({ at: r.paidAt!, kind: 'payment' as const, title: `Payment received · ₹${(Number(r.fee) || 0).toLocaleString('en-IN')}`, detail: `${r.name} · ${r.eventTitle}`, href: '/payments' })),
    ...members.map((m) => ({ at: m.createdAt, kind: 'member' as const, title: `${m.name} applied`, detail: `${MEMBERSHIP_PLANS.find((p) => p.key === m.plan)?.name ?? m.plan} · ${m.city}`, href: '/members' })),
    ...messages.map((m) => ({ at: m.createdAt, kind: 'message' as const, title: `Message from ${m.name}`, detail: m.subject, href: '/messages' })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  return {
    range: { key: rangeKey, label: option.label, from, to, bucketDays },
    kpis,
    timeline,
    paymentMix,
    funnel,
    seatFill,
    utilisation,
    byCity,
    byCategory,
    byWing,
    byPlan,
    heatmap,
    insights,
    activity,
    totals: { registrations: regs.length, members: members.length, messages: messages.length },
  };
}
