import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { RazorpayProvider } from './razorpay.provider';

test('RazorpayProvider HMAC signature verification', () => {
  const provider = new RazorpayProvider();
  const orderId = 'order_test123';
  const paymentId = 'pay_test456';

  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_dummy_key_12345';
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = provider.verifySignature(orderId, paymentId, validSignature);
  assert.equal(isValid, true, 'HMAC signature should be valid');

  const isInvalid = provider.verifySignature(orderId, paymentId, 'invalid_signature_hex');
  assert.equal(isInvalid, false, 'Invalid HMAC signature should be rejected');
});
