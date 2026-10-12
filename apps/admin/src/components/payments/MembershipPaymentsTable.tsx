'use client';

import React from 'react';
import { Pagination, usePagination } from '@ascend/ui';
import { formatDateTime, formatINR } from '../../lib/format';
import { DataTable, EmptyRow } from '../ui/Display';

export interface MembershipPaymentRow {
  receipt: string;
  name: string;
  email: string;
  plan: string;
  amount: number;
  method: 'razorpay' | 'offline';
  gatewayPaymentId?: string;
  paidAt: string;
  validUntil: string;
}

/** Membership fee payments (online or recorded offline), newest first, paged. */
export function MembershipPaymentsTable({ rows }: { rows: MembershipPaymentRow[] }) {
  const pager = usePagination(rows, 10);
  return (
    <>
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
          {rows.length === 0 && <EmptyRow colSpan={7}>No membership payments yet.</EmptyRow>}
          {pager.pageItems.map((p) => (
            <tr key={p.receipt}>
              <td className="font-mono text-[12.5px]">{p.receipt}</td>
              <td>
                <div className="font-medium text-[var(--fg)]">{p.name}</div>
                <div className="text-[12px] text-[var(--muted)]">{p.email}</div>
              </td>
              <td>{p.plan}</td>
              <td className="font-medium">{formatINR(p.amount)}</td>
              <td>
                {p.method === 'razorpay' ? 'Online' : 'Offline'}
                {p.gatewayPaymentId && <div className="font-mono text-[11.5px] text-[var(--muted)]">{p.gatewayPaymentId}</div>}
              </td>
              <td>{formatDateTime(p.paidAt)}</td>
              <td>{p.validUntil.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      <Pagination
        page={pager.page}
        pages={pager.pages}
        total={pager.total}
        pageSize={pager.pageSize}
        onChange={pager.setPage}
        onPageSizeChange={pager.setPageSize}
        noun="payments"
      />
    </>
  );
}
