'use client';

import React, { useMemo, useState } from 'react';
import { Ban, CircleCheck, Eye, RotateCcw } from 'lucide-react';
import { Modal, Pagination, usePagination } from '@ascend/ui';
import { filterRegistrations, type AdminRegistration } from '../../lib/filters';
import { PAYMENT_STATUS_LABEL, REGISTRATION_STATUS_LABEL, formatDateTime, formatFee } from '../../lib/format';
import { DataTable, EmptyRow, PaymentChip, RegistrationChip } from '../ui/Display';
import { ExportButtons, FilterSelect, SearchInput, Toolbar } from '../ui/Controls';
import { canCancel, canMarkPaid, canRefund, useRegistrationAction } from './useRegistrationAction';

const PAYMENT_OPTIONS = Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(REGISTRATION_STATUS_LABEL).map(([value, label]) => ({ value, label }));

const iconBtn =
  'grid h-8 w-8 shrink-0 place-items-center rounded-full border border-mist/[0.12] text-[var(--muted)] transition hover:text-[var(--fg)] disabled:opacity-40';

function Detail({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]">{label}</dt>
      <dd className="break-words text-[14px] text-[var(--fg)]">{value || '—'}</dd>
    </div>
  );
}

export function RegistrationsTable({
  rows,
  events,
  fixedEventId,
  initial = {},
}: {
  rows: AdminRegistration[];
  /** Event filter options; omit on a single-event dashboard. */
  events?: { id: string; title: string }[];
  fixedEventId?: string;
  initial?: { q?: string; event?: string; payment?: string; status?: string };
}) {
  const [q, setQ] = useState(initial.q ?? '');
  const [eventId, setEventId] = useState(fixedEventId ?? initial.event ?? '');
  const [payment, setPayment] = useState(initial.payment ?? '');
  const [status, setStatus] = useState(initial.status ?? '');
  const [viewing, setViewing] = useState<AdminRegistration | null>(null);
  const { request, setAttended, busy, dialog } = useRegistrationAction();

  const filtered = useMemo(
    () => filterRegistrations(rows, { q, event: eventId || undefined, payment: payment || undefined, status: status || undefined }),
    [rows, q, eventId, payment, status]
  );
  const pager = usePagination(filtered, 25, [q, eventId, payment, status]);

  return (
    <div className="flex flex-col gap-5">
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Name, email, mobile, booking ID…" label="Search registrations" />
        {events && !fixedEventId && (
          <FilterSelect label="Event" value={eventId} onChange={setEventId} options={events.map((e) => ({ value: e.id, label: e.title }))} className="sm:max-w-[260px]" />
        )}
        <FilterSelect label="Payment" value={payment} onChange={setPayment} options={PAYMENT_OPTIONS} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <div className="sm:ml-auto">
          <ExportButtons dataset="registrations" params={{ q, event: eventId, payment, status }} label="Export registrations" />
        </div>
      </Toolbar>
      <p className="text-[12.5px] text-[var(--muted)]" aria-live="polite">
        Showing {filtered.length} of {rows.length} registrations
      </p>

      <DataTable label="Registrations">
        <thead>
          <tr>
            <th scope="col">Attendee</th>
            {!fixedEventId && <th scope="col">Event</th>}
            <th scope="col">Booking</th>
            <th scope="col">Fee</th>
            <th scope="col">Payment</th>
            <th scope="col">Status</th>
            <th scope="col">Attended</th>
            <th scope="col" className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <EmptyRow colSpan={fixedEventId ? 7 : 8}>{rows.length === 0 ? 'No registrations yet.' : 'No registrations match these filters.'}</EmptyRow>
          )}
          {pager.pageItems.map((r) => (
            <tr key={r.id}>
              <td className="max-w-[240px]">
                <span className="block truncate font-medium text-[var(--fg)]">{r.name}</span>
                <span className="block truncate text-[12px] text-[var(--muted)]">{r.email}</span>
                <span className="block truncate text-[12px] text-[var(--muted)]">{r.mobile}</span>
              </td>
              {!fixedEventId && <td className="max-w-[220px] truncate text-[13px]">{r.eventTitle}</td>}
              <td className="whitespace-nowrap">
                <span className="block font-mono text-[12.5px] text-[var(--fg)]">{r.bookingId}</span>
                <span className="text-[12px] text-[var(--muted)]">{formatDateTime(r.createdAt)}</span>
              </td>
              <td className="whitespace-nowrap font-mono text-[13px] tabular-nums">{formatFee(r.fee)}</td>
              <td>
                <PaymentChip status={r.paymentStatus} />
              </td>
              <td>
                <RegistrationChip status={r.status} />
              </td>
              <td>
                <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-[var(--muted)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--lime)] disabled:cursor-not-allowed"
                    checked={Boolean(r.attended)}
                    disabled={r.status !== 'confirmed' || busy === r.id}
                    onChange={(e) => void setAttended(r, e.target.checked)}
                  />
                  <span className="sr-only">Mark {r.name} as attended</span>
                  <span aria-hidden>{r.attended ? 'Present' : '—'}</span>
                </label>
              </td>
              <td>
                <div className="flex items-center justify-end gap-1.5">
                  <button type="button" className={iconBtn} onClick={() => setViewing(r)} title="View details">
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">View {r.name}</span>
                  </button>
                  {canMarkPaid(r) && (
                    <button type="button" className={`${iconBtn} hover:!text-ok`} onClick={() => request('mark_paid', r)} disabled={busy === r.id} title="Mark paid (offline payment)">
                      <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Mark {r.name} paid</span>
                    </button>
                  )}
                  {canRefund(r) && (
                    <button type="button" className={`${iconBtn} hover:!text-gold`} onClick={() => request('mark_refunded', r)} disabled={busy === r.id} title="Mark refunded">
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Mark {r.name} refunded</span>
                    </button>
                  )}
                  {canCancel(r) && (
                    <button type="button" className={`${iconBtn} hover:!text-bad`} onClick={() => request('cancel', r)} disabled={busy === r.id} title="Cancel registration">
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Cancel {r.name}&apos;s registration</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <Pagination page={pager.page} pages={pager.pages} total={pager.total} pageSize={pager.pageSize} onChange={pager.setPage} noun="registrations" />

      {dialog}

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title={viewing?.name} description={viewing ? `${viewing.bookingId} · ${viewing.eventTitle}` : undefined} maxWidth="lg">
        {viewing && (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Detail label="Email" value={viewing.email} />
            <Detail label="Mobile" value={viewing.mobile} />
            <Detail label="City" value={viewing.city} />
            <Detail label="Organisation" value={viewing.organisation} />
            <Detail label="Designation" value={viewing.designation} />
            <Detail label="Membership no." value={viewing.membershipNo} />
            <Detail label="Fee" value={formatFee(viewing.fee)} />
            <Detail label="Payment" value={<PaymentChip status={viewing.paymentStatus} />} />
            <Detail label="Status" value={<RegistrationChip status={viewing.status} />} />
            <Detail label="Paid at" value={viewing.paidAt ? formatDateTime(viewing.paidAt) : undefined} />
            <Detail label="Gateway order ID" value={viewing.gatewayOrderId} />
            <Detail label="Gateway payment ID" value={viewing.gatewayPaymentId} />
            <Detail label="Registered" value={formatDateTime(viewing.createdAt)} />
            <Detail label="Last updated" value={formatDateTime(viewing.updatedAt)} />
            <div className="sm:col-span-2">
              <Detail label="Special requirements" value={viewing.requirements} />
            </div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
