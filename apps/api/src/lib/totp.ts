import { authenticator } from 'otplib';
import QRCode from 'qrcode';

authenticator.options = {
  window: 1, // allow 1 step before / after for clock drift
};

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function generateTotpKeyUri(email: string, secret: string): string {
  return authenticator.keyuri(email, 'ASCEND Admin', secret);
}

export async function generateTotpQrCodeDataUrl(keyUri: string): Promise<string> {
  return QRCode.toDataURL(keyUri);
}

export function verifyTotpToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (_e) {
    return false;
  }
}
