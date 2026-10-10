/**
 * Razorpay refunds from the admin console (server only).
 * Uses the same RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET as the website. In test mode
 * (rzp_test_ keys) no real money moves; with live keys this refunds real payments.
 */

export function razorpayConfigured(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
}

export type RefundResult = { ok: true; refundId: string; status: string } | { ok: false; error: string };

/** Full refund of a captured payment. `amount` is in rupees. */
export async function refundPayment(paymentId: string, amount: number, bookingId: string): Promise<RefundResult> {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) return { ok: false, error: 'Razorpay keys are not configured for the admin console.' };
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) return { ok: false, error: 'This booking has no Razorpay payment ID.' };

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        speed: 'normal',
        receipt: `refund-${bookingId}`.slice(0, 40),
        notes: { bookingId },
      }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as { id?: string; status?: string; error?: { description?: string } };
    if (!res.ok || !data.id) {
      console.error('[razorpay] refund failed', res.status, data.error?.description);
      return { ok: false, error: data.error?.description || 'Razorpay could not process the refund.' };
    }
    return { ok: true, refundId: data.id, status: data.status || 'pending' };
  } catch (err) {
    console.error('[razorpay] refund error', err);
    return { ok: false, error: 'Could not reach Razorpay. Please try again.' };
  }
}
