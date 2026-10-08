import * as jose from 'jose';
import { Role } from '@ascend/shared';
import { env } from '../config/env';

export interface TokenPayload {
  sub: string; // User ID
  email: string;
  role: Role;
  aud: 'ascend-web' | 'ascend-admin';
  twoFactorVerified?: boolean;
  sudoExpiresAt?: number;
}

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
const adminSecret = new TextEncoder().encode(env.JWT_ADMIN_SECRET);

export async function signMemberAccessToken(user: {
  id: string;
  email: string;
  role: Role;
}): Promise<string> {
  return new jose.SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    aud: 'ascend-web',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(accessSecret);
}

export async function signMemberRefreshToken(userId: string): Promise<string> {
  return new jose.SignJWT({ sub: userId, aud: 'ascend-web' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret);
}

export async function verifyMemberAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, accessSecret, {
    audience: 'ascend-web',
  });
  return payload as unknown as TokenPayload;
}

export async function signAdminAccessToken(user: {
  id: string;
  email: string;
  role: Role;
  twoFactorVerified: boolean;
  sudoExpiresAt?: number;
}): Promise<string> {
  return new jose.SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    aud: 'ascend-admin',
    twoFactorVerified: user.twoFactorVerified,
    sudoExpiresAt: user.sudoExpiresAt,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // Shorter lifetime for admin
    .sign(adminSecret);
}

export async function verifyAdminAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jose.jwtVerify(token, adminSecret, {
    audience: 'ascend-admin',
  });
  return payload as unknown as TokenPayload;
}
