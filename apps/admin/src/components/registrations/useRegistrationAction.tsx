'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import type { AdminRegistration } from '../../lib/filters';
import { formatFee } from '../../lib/format';
import { ConfirmDialog } from '../ui/Controls';

export type ConfirmableAction = 'mark_paid' | 'cancel' | 'mark_refunded' | 'refund';

const COPY: Record<ConfirmableAction, { title: string; label: string; danger?: boolean; body: (r: AdminRegistration) => string }> = {
  mark_paid: {
    title: 'Mark as paid?',
    label: 'Mark paid',
    body: (r) =>
      `Record an offline payment of ${formatFee(r.fee)} for ${r.name} (${r.bookingId}). The registration will be confirmed${
        r.status === 'confirmed' ? '' : ' and one seat will be reserved'
      }.`,
  },
  cancel: {
    title: 'Cancel this registration?',
    label: 'Cancel registration',
    danger: true,
    body: (r) =>
      `${r.name}'s booking ${r.bookingId} will be cancelled${r.status === 'confirmed' ? ' and the seat released' : ''}.${
        r.paymentStatus === 'paid' ? ' The payment is not refunded automatically — mark it refunded once the refund is processed.' : ''
      }`,
  },
  refund: {
    title: 'Refund through Razorpay?',
    label: 'Refund now',
    danger: true,
    body: (r) =>
      `${formatFee(r.fee)} will be refunded in full to ${r.name}'s original payment method (payment ${r.gatewayPaymentId}). The booking will be cancelled${
        r.status === 'confirmed' ? ' and the seat released' : ''
      }, and ${r.name} will get an email. This cannot be undone.`,
  },
  mark_refunded: {
    title: 'Mark payment refunded?',
    label: 'Mark refunded',
    danger: true,
    body: (r) =>
      `Confirm that ${formatFee(r.fee)} has been refunded to ${r.name}. The registration will be cancelled${
        r.status === 'confirmed' ? ' and the seat released' : ''
      }.`,
  },
};

/** Registration status actions with a confirmation step and toast feedback. */
export function useRegistrationAction() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<{ action: ConfirmableAction; row: AdminRegistration } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (row: AdminRegistration, body: Record<string, unknown>, success: string) => {
    setBusy(row.id);
    const res = await api('/api/registrations', { method: 'PATCH', body: { id: row.id, ...body } });
    setBusy(null);
    setPending(null);
    if (!res.ok) {
      toast(res.error ?? 'Action failed');
      return false;
    }
    toast(success);
    router.refresh();
    return true;
  };

  const request = (action: ConfirmableAction, row: AdminRegistration) => setPending({ action, row });

  const setAttended = (row: AdminRegistration, value: boolean) =>
    run(row, { action: 'set_attended', value }, value ? `${row.name} checked in` : `${row.name} marked absent`);

  const dialog = pending ? (
    <ConfirmDialog
      open
      title={COPY[pending.action].title}
      description={COPY[pending.action].body(pending.row)}
      confirmLabel={COPY[pending.action].label}
      danger={COPY[pending.action].danger}
      busy={busy === pending.row.id}
      onClose={() => setPending(null)}
      onConfirm={() =>
        void run(
          pending.row,
          { action: pending.action },
          pending.action === 'mark_paid'
            ? 'Payment recorded'
            : pending.action === 'cancel'
              ? 'Registration cancelled'
              : pending.action === 'refund'
                ? 'Refund initiated with Razorpay'
                : 'Refund recorded'
        )
      }
    />
  ) : null;

  return { request, setAttended, busy, dialog };
}

export function canMarkPaid(r: AdminRegistration) {
  return r.status !== 'cancelled' && r.paymentStatus !== 'paid' && r.paymentStatus !== 'refunded' && (r.fee > 0 || r.status === 'pending_payment');
}
export function canCancel(r: AdminRegistration) {
  return r.status !== 'cancelled';
}
export function canRefund(r: AdminRegistration) {
  return r.paymentStatus === 'paid';
}
/** Paid online, so it can be refunded through the gateway. */
export function canGatewayRefund(r: AdminRegistration) {
  return r.paymentStatus === 'paid' && /^pay_/.test(r.gatewayPaymentId ?? '');
}
