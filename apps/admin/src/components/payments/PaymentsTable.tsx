'use client';

import React, { useMemo, useState } from 'react';
import { CircleCheck, RotateCcw } from 'lucide-react';
import { filterPayments, type AdminRegistration } from '../../lib/filters';
import { formatDateTime, formatINR } from '../../lib/format';
import { DataTable, EmptyRow, PaymentChip, RegistrationChip } from '../ui/Display';
import { ExportButtons, FilterSelect, SearchInput, Toolbar } from '../ui/Controls';
import { canMarkPaid, canRefund, useRegistrationAction } from '../registrations/useRegistrationAction';

const PAYMENT_OPTIONS = [
  { value: 'paid', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const actionBtn =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-mist/[0.12] px-3 py-1.5 text-[12px] font-medium text-[var(--fg)] transition hover:border-brand-300/50 disabled:opacity-40';

export function PaymentsTable({
  rows,
  events,
  initial = {},
}: {
  rows: AdminRegistration[];
  events: { id: string; title: string }[];
  initial?: { q?: string; event?: string; payment?: string };
}) {
  const [q, setQ] = useState(initial.q ?? '');
  const [eventId, setEventId] = useState(initial.event ?? '');
  const [payment, setPayment] = useState(initial.payment ?? '');
  const { request, busy, dialog } = useRegistrationAction();

  const filtered = useMemo(
    () => filterPayments(rows, { q, event: eventId || undefined, payment: payment || undefined }),
    [rows, q, eventId, payment]
  );
  const total = filtered.reduce((s, r) => s + (r.paymentStatus === 'paid' ? Number(r.fee) || 0 : 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Name, booking, order or payment ID…" label="Search payments" />
        <FilterSelect label="Event" value={eventId} onChange={setEventId} options={events.map((e) => ({ value: e.id, label: e.title }))} className="sm:max-w-[260px]" />
        <FilterSelect label="Status" value={payment} onChange={setPayment} options={PAYMENT_OPTIONS} />
        <div className="sm:ml-auto">
          <ExportButtons dataset="payments" params={{ q, event: eventId, payment }} label="Download payment report" />
        </div>
      </Toolbar>
      <p className="text-[12.5px] text-[var(--muted)]" aria-live="polite">
        {filtered.length} transactions · {formatINR(total)} collected in this view
      </p>

      <DataTable label="Payments">
        <thead>
          <tr>
            <th scope="col">Payer</th>
            <th scope="col">Event</th>
            <th scope="col">Amount</th>
            <th scope="col">Payment</th>
            <th scope="col">Gateway IDs</th>
            <th scope="col">Paid at</th>
            <th scope="col">Booking</th>
            <th scope="col" className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <EmptyRow colSpan={8}>{rows.length === 0 ? 'No paid-event transactions yet.' : 'No payments match these filters.'}</EmptyRow>
          )}
          {filtered.map((r) => (
            <tr key={r.id}>
              <td className="max-w-[220px]">
                <span className="block truncate font-medium text-[var(--fg)]">{r.name}</span>
                <span className="block truncate text-[12px] text-[var(--muted)]">{r.email}</span>
              </td>
              <td className="max-w-[200px] truncate text-[13px]">{r.eventTitle}</td>
              <td className="whitespace-nowrap font-mono text-[13px] tabular-nums text-[var(--fg)]">{formatINR(r.fee)}</td>
              <td>
                <PaymentChip status={r.paymentStatus} />
              </td>
              <td className="max-w-[220px]">
                <span className="block truncate font-mono text-[11.5px] text-[var(--fg)]" title={r.gatewayOrderId}>
                  {r.gatewayOrderId || '—'}
                </span>
                <span className="block truncate font-mono text-[11.5px] text-[var(--muted)]" title={r.gatewayPaymentId}>
                  {r.gatewayPaymentId || '—'}
                </span>
              </td>
              <td className="whitespace-nowrap text-[12.5px] text-[var(--muted)]">{r.paidAt ? formatDateTime(r.paidAt) : '—'}</td>
              <td className="whitespace-nowrap">
                <span className="mb-1 block font-mono text-[12px]">{r.bookingId}</span>
                <RegistrationChip status={r.status} />
              </td>
              <td>
                <div className="flex justify-end gap-1.5">
                  {canMarkPaid(r) && (
                    <button type="button" className={actionBtn} onClick={() => request('mark_paid', r)} disabled={busy === r.id}>
                      <CircleCheck className="h-3.5 w-3.5 text-ok" aria-hidden />
                      Mark paid
                    </button>
                  )}
                  {canRefund(r) && (
                    <button type="button" className={actionBtn} onClick={() => request('mark_refunded', r)} disabled={busy === r.id}>
                      <RotateCcw className="h-3.5 w-3.5 text-gold" aria-hidden />
                      Refunded
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      {dialog}
    </div>
  );
}
