import crypto from 'node:crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY = crypto.scryptSync(env.DATA_ENCRYPTION_KEY, 'ascend-salt', 32);

export function encryptField(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptField(cipherText: string): string {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex!, 'hex');
    const authTag = Buffer.from(authTagHex!, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex!, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (_e) {
    return cipherText;
  }
}
