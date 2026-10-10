/**
 * Paid-membership rules shared by the website and the admin console (pure functions).
 *
 * Flow: apply → admin approves (fee fixed) → member pays → active for 12 months from payment.
 * Paying while still active extends from the current expiry, so renewing early loses nothing.
 */
import { MEMBERSHIP_PLANS } from '../constants/organisation';
import type { CommunityMemberApplication, MembershipPayment, SiteSettings } from '../data/initial-data';

export type MembershipState = 'pending' | 'rejected' | 'awaiting_payment' | 'active' | 'expired';

export const MEMBERSHIP_TERM_MONTHS = 12;
/** Renewal reminder is emailed this many days before expiry. */
export const RENEWAL_REMINDER_DAYS = 14;

export function membershipState(app: Pick<CommunityMemberApplication, 'status' | 'validUntil' | 'payments'>, now = new Date()): MembershipState {
  if (app.status === 'pending') return 'pending';
  if (app.status === 'rejected') return 'rejected';
  if (!app.validUntil) return 'awaiting_payment';
  return Date.parse(app.validUntil) > now.getTime() ? 'active' : 'expired';
}

/** Current annual fee for a plan: the Site Settings override, else the Blueprint price. */
export function membershipFeeFor(plan: CommunityMemberApplication['plan'], settings?: Pick<SiteSettings, 'membershipFees'>): number {
  const override = settings?.membershipFees?.[plan];
  if (typeof override === 'number' && Number.isFinite(override) && override >= 0) return Math.round(override);
  return MEMBERSHIP_PLANS.find((p) => p.key === plan)?.price ?? 0;
}

export function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  if (d.getUTCDate() < day) d.setUTCDate(0); // 31 Jan + 1 month → end of Feb, not 3 Mar
  return d.toISOString();
}

/**
 * Records a payment on an application (mutates it) and returns the payment.
 * Idempotent per gateway payment id. The new term starts at the later of now and the current expiry.
 */
export function recordMembershipPayment(
  app: CommunityMemberApplication,
  p: { id: string; amount: number; method: MembershipPayment['method']; gatewayOrderId?: string; gatewayPaymentId?: string; recordedBy?: string },
  now = new Date()
): { payment: MembershipPayment; duplicate: boolean } {
  const existing = p.gatewayPaymentId ? app.payments?.find((x) => x.gatewayPaymentId === p.gatewayPaymentId) : undefined;
  if (existing) return { payment: existing, duplicate: true };
  const stamp = now.toISOString();
  const validFrom = app.validUntil && Date.parse(app.validUntil) > now.getTime() ? app.validUntil : stamp;
  const payment: MembershipPayment = {
    id: p.id,
    amount: p.amount,
    method: p.method,
    gatewayOrderId: p.gatewayOrderId,
    gatewayPaymentId: p.gatewayPaymentId,
    paidAt: stamp,
    validFrom,
    validUntil: addMonths(validFrom, MEMBERSHIP_TERM_MONTHS),
    recordedBy: p.recordedBy,
  };
  app.payments = [...(app.payments ?? []), payment];
  app.validUntil = payment.validUntil;
  app.gatewayOrderId = undefined;
  app.updatedAt = stamp;
  return { payment, duplicate: false };
}

/** Receipt number like MEM-7K2Q9X (unique within the given set). */
export function newMembershipReceiptId(taken: Set<string>, random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    let s = 'MEM-';
    for (let i = 0; i < 6; i++) s += alphabet[Math.floor(random() * alphabet.length)];
    if (!taken.has(s)) return s;
  }
}
