import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptField, decryptField } from './crypto';

test('AES-256-GCM encryption and decryption', () => {
  const plainMrn = '084291';
  const encrypted = encryptField(plainMrn);

  assert.notEqual(encrypted, plainMrn);
  assert.equal(encrypted.split(':').length, 3, 'Must be iv:authTag:cipher format');

  const decrypted = decryptField(encrypted);
  assert.equal(decrypted, plainMrn, 'Decrypted value must equal original plain text');
});
