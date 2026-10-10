import { NextRequest } from 'next/server';
import {
  MEMBERSHIP_PLANS,
  ORG_WINGS,
  type CommunityMemberApplication,
  type CommunityRegistration,
} from '@ascend/shared';
import { readPrivate, readStore } from '../../../../lib/community-store';
import { exportResponse, type ExportColumn, type ExportFormat } from '../../../../lib/export';
import { byNewest, filterMembers, filterPayments, filterRegistrations } from '../../../../lib/filters';
import { MEMBER_STATUS_LABEL, PAYMENT_STATUS_LABEL, REGISTRATION_STATUS_LABEL, slugify } from '../../../../lib/format';
import { bad, handleError } from '../../../../lib/api-helpers';

/**
 * Data exports: GET /api/export/{registrations|payments|members}?format=csv|xlsx&<filters>
 *
 * Filters mirror the admin tables (q, event, payment, status, plan, city) so the file contains
 * what the admin sees. Protected by the admin access gate (src/middleware.ts).
 */
export const dynamic = 'force-dynamic';

const DATASETS = ['registrations', 'payments', 'members'] as const;
type Dataset = (typeof DATASETS)[number];

function param(sp: URLSearchParams, key: string): string | undefined {
  const v = sp.get(key);
  return v ? v.slice(0, 200) : undefined;
}

export async function GET(request: NextRequest, context: { params: Promise<{ dataset: string }> }) {
  try {
    const { dataset } = await context.params;
    if (!(DATASETS as readonly string[]).includes(dataset)) return bad('Unknown export', 404);
    const sp = request.nextUrl.searchParams;
    const formatParam = sp.get('format') ?? 'csv';
    if (formatParam !== 'csv' && formatParam !== 'xlsx' && formatParam !== 'xls') return bad('Format must be csv or xlsx');
    // "xls" (old links) now gets the modern .xlsx file too.
    const format: ExportFormat = formatParam === 'csv' ? 'csv' : 'xlsx';

    const priv = readPrivate();
    const events = readStore().events;
    const eventById = new Map(events.map((e) => [e.id, e]));
    const eventDate = (r: CommunityRegistration) => eventById.get(r.eventId)?.date ?? '';

    switch (dataset as Dataset) {
      case 'registrations': {
        const eventId = param(sp, 'event');
        const rows = filterRegistrations(priv.registrations, {
          q: param(sp, 'q'),
          event: eventId,
          payment: param(sp, 'payment'),
          status: param(sp, 'status'),
        }).sort(byNewest);
        const columns: ExportColumn<CommunityRegistration>[] = [
          { header: 'Booking ID', value: (r) => r.bookingId },
          { header: 'Event', value: (r) => r.eventTitle },
          { header: 'Event date', value: eventDate },
          { header: 'Name', value: (r) => r.name },
          { header: 'Email', value: (r) => r.email },
          { header: 'Mobile', value: (r) => r.mobile },
          { header: 'City', value: (r) => r.city },
          { header: 'Organisation', value: (r) => r.organisation },
          { header: 'Designation', value: (r) => r.designation },
          { header: 'Membership No.', value: (r) => r.membershipNo },
          { header: 'Special requirements', value: (r) => r.requirements },
          { header: 'Fee (INR)', value: (r) => Number(r.fee) || 0 },
          { header: 'Registration status', value: (r) => REGISTRATION_STATUS_LABEL[r.status] ?? r.status },
          { header: 'Payment status', value: (r) => PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus },
          { header: 'Gateway order ID', value: (r) => r.gatewayOrderId },
          { header: 'Gateway payment ID', value: (r) => r.gatewayPaymentId },
          { header: 'Paid at', value: (r) => r.paidAt },
          { header: 'Attended', value: (r) => Boolean(r.attended) },
          { header: 'Registered at', value: (r) => r.createdAt },
        ];
        const ev = eventId ? eventById.get(eventId) : undefined;
        return exportResponse(rows, columns, {
          format,
          baseName: ev ? `registrations-${ev.slug || slugify(ev.title)}` : 'registrations',
          sheetTitle: 'Registrations',
        });
      }
      case 'payments': {
        const rows = filterPayments(priv.registrations, {
          q: param(sp, 'q'),
          event: param(sp, 'event'),
          payment: param(sp, 'payment'),
        }).sort(byNewest);
        const columns: ExportColumn<CommunityRegistration>[] = [
          { header: 'Booking ID', value: (r) => r.bookingId },
          { header: 'Event', value: (r) => r.eventTitle },
          { header: 'Event date', value: eventDate },
          { header: 'Name', value: (r) => r.name },
          { header: 'Email', value: (r) => r.email },
          { header: 'Mobile', value: (r) => r.mobile },
          { header: 'Amount (INR)', value: (r) => Number(r.fee) || 0 },
          { header: 'Payment status', value: (r) => PAYMENT_STATUS_LABEL[r.paymentStatus] ?? r.paymentStatus },
          { header: 'Gateway order ID', value: (r) => r.gatewayOrderId },
          { header: 'Gateway payment ID', value: (r) => r.gatewayPaymentId },
          { header: 'Paid at', value: (r) => r.paidAt },
          { header: 'Registration status', value: (r) => REGISTRATION_STATUS_LABEL[r.status] ?? r.status },
          { header: 'Created at', value: (r) => r.createdAt },
        ];
        return exportResponse(rows, columns, { format, baseName: 'payment-report', sheetTitle: 'Payments' });
      }
      case 'members': {
        const rows = filterMembers(priv.members, {
          q: param(sp, 'q'),
          plan: param(sp, 'plan'),
          status: param(sp, 'status'),
          city: param(sp, 'city'),
        }).sort(byNewest);
        const planName = (m: CommunityMemberApplication) =>
          MEMBERSHIP_PLANS.find((p) => p.key === m.plan)?.name ?? m.plan;
        const wingNames = (m: CommunityMemberApplication) =>
          (m.interests ?? [])
            .map((n) => ORG_WINGS.find((w) => w.number === n)?.name)
            .filter(Boolean)
            .join('; ');
        const columns: ExportColumn<CommunityMemberApplication>[] = [
          { header: 'Application ID', value: (m) => m.id },
          { header: 'Name', value: (m) => m.name },
          { header: 'Email', value: (m) => m.email },
          { header: 'Mobile', value: (m) => m.mobile },
          { header: 'City', value: (m) => m.city },
          { header: 'Plan', value: planName },
          { header: 'Membership No.', value: (m) => m.membershipNo },
          { header: 'Qualification year', value: (m) => m.qualificationYear },
          { header: 'Area of practice', value: (m) => m.areaOfPractice },
          { header: 'Organisation', value: (m) => m.organisation },
          { header: 'LinkedIn', value: (m) => m.linkedinUrl },
          { header: 'Wing interests', value: wingNames },
          { header: 'Status', value: (m) => MEMBER_STATUS_LABEL[m.status] ?? m.status },
          { header: 'Applied at', value: (m) => m.createdAt },
          { header: 'Updated at', value: (m) => m.updatedAt },
        ];
        return exportResponse(rows, columns, { format, baseName: 'member-database', sheetTitle: 'Members' });
      }
    }
  } catch (error) {
    return handleError(error, 'Export');
  }
}
