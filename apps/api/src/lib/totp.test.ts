import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticator } from 'otplib';
import { generateTotpSecret, generateTotpKeyUri, verifyTotpToken } from './totp';

test('TOTP generation and verification', () => {
  const secret = generateTotpSecret();
  assert.ok(secret);

  const uri = generateTotpKeyUri('admin@ascendca.in', secret);
  assert.ok(uri.startsWith('otpauth://totp/'));

  const token = authenticator.generate(secret);
  assert.equal(token.length, 6);

  const isValid = verifyTotpToken(token, secret);
  assert.equal(isValid, true, 'Current token must verify successfully');

  const isInvalid = verifyTotpToken('000000', secret);
  assert.equal(isInvalid, false, 'Invalid token must be rejected');
});
