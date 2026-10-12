/**
 * Member accounts (server only), stored in PostgreSQL (tables member_accounts, member_profiles,
 * auth_tokens — see packages/db).
 *
 * Passwords are hashed with scrypt and a per-password salt (async, so hashing never blocks the
 * server). Email-verification and password-reset links carry a random token of which only the
 * SHA-256 hash is stored; a token is single use. `sessionVersion` is bumped whenever the password
 * changes, which signs out every existing session.
 */
import crypto from 'crypto';
import { promisify } from 'util';
import { membershipState, type CommunityMemberApplication } from '@ascend/shared';
import { prisma, isUniqueViolation, type Prisma } from '@ascend/db';
import { store } from './community-store';

export interface MemberProfile {
  city?: string;
  membershipNo?: string;
  qualificationYear?: string;
  areaOfPractice?: string;
  organisation?: string;
  designation?: string;
  linkedinUrl?: string;
  bio?: string;
  /** /api/account/photo/<file> */
  photoUrl?: string;
  /** Listed in the members-only directory (approved members only; off by default). */
  directoryOptIn?: boolean;
}

export interface MemberAccount {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  passwordHash: string;
  emailVerifiedAt?: string;
  sessionVersion: number;
  profile: MemberProfile;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

type Row = Prisma.MemberAccountGetPayload<{ include: { profile: true } }>;
const withProfile = { profile: true } as const;
const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const isoOpt = (d: Date | null | undefined) => (d ? d.toISOString() : undefined);

function toAccount(a: Row): MemberAccount {
  const p = a.profile;
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    mobile: opt(a.mobile),
    passwordHash: a.passwordHash,
    emailVerifiedAt: isoOpt(a.emailVerifiedAt),
    sessionVersion: a.sessionVersion,
    profile: p
      ? {
          city: opt(p.city),
          membershipNo: opt(p.membershipNo),
          qualificationYear: opt(p.qualificationYear),
          areaOfPractice: opt(p.areaOfPractice),
          organisation: opt(p.organisation),
          designation: opt(p.designation),
          linkedinUrl: opt(p.linkedinUrl),
          bio: opt(p.bio),
          photoUrl: opt(p.photoUrl),
          directoryOptIn: p.directoryOptIn,
        }
      : {},
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    lastLoginAt: isoOpt(a.lastLoginAt),
  };
}

/** HMAC secret for member sessions, from MEMBER_SESSION_SECRET (never stored in the database). */
let devSecret: string | undefined;
export function sessionSecret(): string {
  const secret = process.env.MEMBER_SESSION_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('MEMBER_SESSION_SECRET (32+ characters) must be set');
  if (!devSecret) {
    devSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[auth] MEMBER_SESSION_SECRET is not set — using a temporary secret; sessions end on restart.');
  }
  return devSecret;
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function findAccountByEmail(email: string): Promise<MemberAccount | undefined> {
  const a = await prisma.memberAccount.findUnique({ where: { email: normaliseEmail(email) }, include: withProfile });
  return a ? toAccount(a) : undefined;
}

export async function findAccountById(id: string): Promise<MemberAccount | undefined> {
  if (!id || id.length > 64) return undefined;
  const a = await prisma.memberAccount.findUnique({ where: { id }, include: withProfile });
  return a ? toAccount(a) : undefined;
}

/** Accounts for the members directory: verified and opted in. */
export async function directoryAccounts(): Promise<MemberAccount[]> {
  const rows = await prisma.memberAccount.findMany({
    where: { emailVerifiedAt: { not: null }, profile: { directoryOptIn: true } },
    include: withProfile,
  });
  return rows.map(toAccount);
}

/** Creates an account; null when the email is already registered. */
export async function createAccount(input: { name: string; email: string; mobile?: string; passwordHash: string }): Promise<MemberAccount | null> {
  try {
    const a = await prisma.memberAccount.create({
      data: {
        name: input.name,
        email: normaliseEmail(input.email),
        mobile: input.mobile || null,
        passwordHash: input.passwordHash,
        lastLoginAt: new Date(),
        profile: { create: {} },
      },
      include: withProfile,
    });
    return toAccount(a);
  } catch (err) {
    if (isUniqueViolation(err)) return null;
    throw err;
  }
}

/** Updates name, mobile and profile fields (undefined leaves a field as it is). */
export async function updateAccount(id: string, data: { name?: string; mobile?: string | null; profile?: MemberProfile }): Promise<MemberAccount | null> {
  const profile = data.profile ?? {};
  const profileData = {
    city: profile.city,
    membershipNo: profile.membershipNo,
    qualificationYear: profile.qualificationYear,
    areaOfPractice: profile.areaOfPractice,
    organisation: profile.organisation,
    designation: profile.designation,
    linkedinUrl: profile.linkedinUrl,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    directoryOptIn: profile.directoryOptIn,
  };
  try {
    const a = await prisma.memberAccount.update({
      where: { id },
      data: {
        name: data.name,
        mobile: data.mobile,
        profile: data.profile ? { upsert: { create: profileData, update: profileData } } : undefined,
      },
      include: withProfile,
    });
    return toAccount(a);
  } catch (err) {
    if ((err as { code?: string }).code === 'P2025') return null;
    throw err;
  }
}

/**
 * Sets a new password and bumps sessionVersion (signs out every session). Used by "change
 * password" and by reset links, which also prove the email address.
 */
export async function setPassword(id: string, passwordHash: string, opts: { verifyEmail?: boolean } = {}): Promise<MemberAccount | null> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.memberAccount.findUnique({ where: { id }, select: { emailVerifiedAt: true } });
    if (!current) return null;
    const a = await tx.memberAccount.update({
      where: { id },
      data: {
        passwordHash,
        sessionVersion: { increment: 1 },
        emailVerifiedAt: opts.verifyEmail && !current.emailVerifiedAt ? new Date() : undefined,
      },
      include: withProfile,
    });
    return toAccount(a);
  });
}

export async function recordLogin(id: string): Promise<void> {
  await prisma.memberAccount.update({ where: { id }, data: { lastLoginAt: new Date() } }).catch(() => {});
}

// ---------------------------------------------------------------------------------------------
// Passwords (async scrypt — never blocks the event loop)
// ---------------------------------------------------------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const scrypt = promisify(crypto.scrypt) as (pw: crypto.BinaryLike, salt: crypto.BinaryLike, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = `scrypt$${crypto.randomBytes(16).toString('base64')}$${crypto.randomBytes(64).toString('base64')}`;

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  const [scheme, saltB64, hashB64] = (stored || DUMMY_HASH).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(actual, expected) && !!stored;
}

/** Minimum password policy shown in the forms. */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (password.length > 128) return 'Use at most 128 characters.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use letters and at least one number.';
  if (email && password.toLowerCase().includes(normaliseEmail(email).split('@')[0] || '\0')) {
    return 'Your password should not contain your email name.';
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// One-time tokens (email verification, password reset) — table auth_tokens, hash only
// ---------------------------------------------------------------------------------------------

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export type TokenKind = 'verify' | 'reset';
const PURPOSE = { verify: 'EMAIL_VERIFY', reset: 'PASSWORD_RESET' } as const;
const TTL: Record<TokenKind, number> = { verify: 48 * 3600_000, reset: 3600_000 };

/** Issues a fresh token (replacing any earlier unused one of the same kind) and returns the raw value. */
export async function issueToken(accountId: string, kind: TokenKind): Promise<string | null> {
  const raw = crypto.randomBytes(32).toString('base64url');
  try {
    await prisma.$transaction([
      // Retire (not delete) earlier unused tokens: the web DB role has no DELETE, and history stays.
      prisma.authToken.updateMany({ where: { accountId, purpose: PURPOSE[kind], usedAt: null }, data: { usedAt: new Date() } }),
      prisma.authToken.create({
        data: { accountId, purpose: PURPOSE[kind], tokenHash: sha256(raw), expiresAt: new Date(Date.now() + TTL[kind]) },
      }),
    ]);
    return raw;
  } catch (err) {
    console.error('[auth] could not issue token', (err as Error).message);
    return null;
  }
}

/** Finds the account a still-valid, unused token belongs to (without consuming it). */
export async function accountForToken(raw: string, kind: TokenKind): Promise<MemberAccount | undefined> {
  if (!raw || raw.length > 100) return undefined;
  const t = await prisma.authToken.findUnique({ where: { tokenHash: sha256(raw) }, include: { account: { include: withProfile } } });
  if (!t || t.purpose !== PURPOSE[kind] || t.usedAt || t.expiresAt.getTime() <= Date.now()) return undefined;
  return toAccount(t.account);
}

/** Marks a token used; returns false if it was already used or has expired (single use). */
export async function consumeToken(raw: string, kind: TokenKind): Promise<boolean> {
  const { count } = await prisma.authToken.updateMany({
    where: { tokenHash: sha256(raw), purpose: PURPOSE[kind], usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  return count === 1;
}

/** Confirms the account's email (from a verification link). */
export async function markEmailVerified(id: string): Promise<void> {
  await prisma.memberAccount.updateMany({ where: { id, emailVerifiedAt: null }, data: { emailVerifiedAt: new Date() } });
}

// ---------------------------------------------------------------------------------------------
// Membership (the application linked by verified email)
// ---------------------------------------------------------------------------------------------

export async function membershipFor(account: Pick<MemberAccount, 'email' | 'emailVerifiedAt'>): Promise<CommunityMemberApplication | undefined> {
  if (!account.emailVerifiedAt) return undefined;
  return store.getMember({ email: account.email });
}

/** Members-only access: verified email + an approved, paid and unexpired membership. */
export async function isApprovedMember(account: Pick<MemberAccount, 'email' | 'emailVerifiedAt'> | null | undefined): Promise<boolean> {
  const app = account ? await membershipFor(account) : undefined;
  return !!app && membershipState(app) === 'active';
}

/** The account as the browser may see it. */
export async function publicAccount(a: MemberAccount) {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    mobile: a.mobile,
    emailVerified: !!a.emailVerifiedAt,
    isMember: await isApprovedMember(a),
    photoUrl: a.profile.photoUrl,
  };
}
export type PublicAccount = Awaited<ReturnType<typeof publicAccount>>;
