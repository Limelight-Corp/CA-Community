/**
 * Paid membership on the website (server only): Razorpay orders and payment recording for an
 * approved application. The application is found through the signed-in account's verified
 * email, so only its owner can pay or download its receipts.
 */
import {
  adminMembershipPaidEmail,
  MEMBERSHIP_PLANS,
  membershipFeeFor,
  membershipPaidEmail,
  membershipState,
  newMembershipReceiptId,
  recordMembershipPayment,
  type CommunityMemberApplication,
  type MembershipPayment,
} from '@ascend/shared';
import { getSettings, store } from './community-store';
import { membershipFor, type MemberAccount } from './member-accounts';
import { adminRecipients, adminUrl, emailBrand, queueMail } from './mailer';
import { siteUrl } from './seo';
import { razorpayConfig } from '../app/api/registrations/_lib/server';

export const planName = (plan: CommunityMemberApplication['plan']) => MEMBERSHIP_PLANS.find((p) => p.key === plan)?.name ?? plan;

/**
 * Fee for the next payment: the first payment uses the fee fixed at approval; renewals use the
 * plan's current price (Site Settings).
 */
export async function feeFor(app: CommunityMemberApplication): Promise<number> {
  const current = membershipFeeFor(app.plan, await getSettings());
  return membershipState(app) === 'awaiting_payment' ? (app.membershipFee ?? current) : current;
}

/** The approved application this account may pay for (null when it can't pay yet). */
export async function payableApplication(account: MemberAccount): Promise<CommunityMemberApplication | null> {
  const app = await membershipFor(account);
  if (!app) return null;
  const state = membershipState(app);
  return state === 'awaiting_payment' || state === 'active' || state === 'expired' ? app : null;
}

export type OrderResult =
  | { ok: true; keyId: string; orderId: string; amount: number; currency: 'INR'; description: string }
  | { ok: false; status: number; error: string };

export async function createMembershipOrder(account: MemberAccount): Promise<OrderResult> {
  const app = await payableApplication(account);
  if (!app) return { ok: false, status: 409, error: 'There is no approved membership to pay for on this account.' };
  const cfg = razorpayConfig();
  if (!cfg) return { ok: false, status: 503, error: 'Online payments are not set up yet. Please contact us to pay offline.' };
  const fee = await feeFor(app);
  if (fee <= 0) return { ok: false, status: 409, error: 'This membership has no fee to pay.' };

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: Math.round(fee * 100),
        currency: 'INR',
        receipt: `mem-${app.id}`.slice(0, 40),
        notes: { kind: 'membership', applicationId: app.id, plan: app.plan },
      }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: { description?: string } };
    if (!res.ok || !data.id) {
      console.error('[razorpay] membership order failed', res.status, data.error?.description);
      return { ok: false, status: 502, error: 'We could not start the payment right now. Please try again in a moment.' };
    }
    const orderId = data.id;
    // Amount of the open order — the payment is checked against it. (The approved fee itself is
    // admin-only and stays untouched.)
    await store.setMemberOrder(app.id, orderId, fee);
    const renewing = membershipState(app) !== 'awaiting_payment';
    return {
      ok: true,
      keyId: cfg.keyId,
      orderId,
      amount: Math.round(fee * 100),
      currency: 'INR',
      description: `${planName(app.plan)} — ${renewing ? 'renewal' : 'annual membership'}`,
    };
  } catch (err) {
    console.error('[razorpay] membership order error', err);
    return { ok: false, status: 502, error: 'We could not reach the payment gateway. Please try again in a moment.' };
  }
}

/**
 * Records a verified Razorpay payment for the application holding `orderId` (idempotent) and
 * sends the receipt + admin alert the first time. Returns null when no application matches.
 */
export async function completeMembershipPayment(
  orderId: string,
  paymentId: string,
  amountPaise?: number
): Promise<{ app: CommunityMemberApplication; payment: MembershipPayment; duplicate: boolean } | 'mismatch' | null> {
  // Membership row locked for the whole step: the browser's verify call and the webhook can never
  // both record the same payment.
  const result = await store.prisma.$transaction(async (tx) => {
    const id = await store.memberIdForOrder(orderId, tx);
    if (!id) return null;
    await tx.$queryRaw`SELECT id FROM memberships WHERE id = ${id} FOR UPDATE`;
    const app = (await store.getMember({ id }, tx))!;
    const fee = app.orderAmount ?? app.membershipFee ?? (await feeFor(app)); // amount of the order that was opened
    const renewal = (app.payments?.length ?? 0) > 0;
    const next = structuredClone(app);
    const { payment, duplicate } = recordMembershipPayment(next, {
      // Receipt ids are random (32^6); the database guarantees uniqueness.
      id: newMembershipReceiptId(new Set()),
      amount: fee,
      method: 'razorpay',
      gatewayOrderId: orderId,
      gatewayPaymentId: paymentId,
    });
    if (duplicate) return { app, payment, duplicate, renewal };
    if (amountPaise !== undefined && amountPaise !== Math.round(fee * 100)) return 'mismatch' as const;
    const saved = (await store.addMemberPayment(id, payment, { validUntil: next.validUntil!, clearOrder: true }, tx)) ?? next;
    return { app: saved, payment, duplicate, renewal };
  });
  if (!result || result === 'mismatch') return result;

  if (!result.duplicate) {
    const brand = await emailBrand();
    const plan = planName(result.app.plan);
    queueMail(
      result.app.email,
      membershipPaidEmail(brand, {
        name: result.app.name,
        plan,
        amount: result.payment.amount,
        receiptId: result.payment.id,
        paymentId: result.payment.gatewayPaymentId,
        validUntil: result.payment.validUntil,
        renewal: result.renewal,
        dashboardUrl: `${siteUrl()}/dashboard`,
      })
    );
    queueMail(
      await adminRecipients(),
      adminMembershipPaidEmail(
        brand,
        { name: result.app.name, email: result.app.email, plan, amount: result.payment.amount, receiptId: result.payment.id, method: 'Online (Razorpay)', validUntil: result.payment.validUntil },
        adminUrl('/members')
      ),
      { replyTo: result.app.email }
    );
  }
  return { app: result.app, payment: result.payment, duplicate: result.duplicate };
}
