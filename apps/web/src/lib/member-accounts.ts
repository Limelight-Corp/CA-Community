/**
 * Member accounts (server only).
 *
 * Stored in data/member-accounts.json (gitignored — personal data). Passwords are hashed with
 * scrypt and a per-password salt; email-verification and password-reset links carry a random
 * token of which only the SHA-256 hash is stored. `sessionVersion` is bumped whenever the
 * password changes, which signs out every existing session.
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { membershipState, type CommunityMemberApplication } from '@ascend/shared';
import { dataDir, readPrivate } from './community-store';

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
  verifyTokenHash?: string;
  verifyTokenExp?: string;
  resetTokenHash?: string;
  resetTokenExp?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AccountStore {
  sessionSecret: string;
  accounts: MemberAccount[];
}

const file = () => path.join(dataDir(), 'member-accounts.json');

function readRaw(): AccountStore {
  try {
    if (fs.existsSync(file())) {
      const data = JSON.parse(fs.readFileSync(file(), 'utf-8')) as Partial<AccountStore>;
      if (data.sessionSecret && Array.isArray(data.accounts)) return data as AccountStore;
    }
  } catch (err) {
    console.error('Failed to read member-accounts.json:', err);
    throw new Error('Member account store is unreadable');
  }
  return { sessionSecret: crypto.randomBytes(32).toString('hex'), accounts: [] };
}

function writeRaw(data: AccountStore): void {
  const tmp = `${file()}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmp, file());
}

/** Read-modify-write in one synchronous step (no interleaving within this process). */
export function mutateAccounts<R>(fn: (data: AccountStore) => R): R {
  const data = readRaw();
  const result = fn(data);
  writeRaw(data);
  return result;
}

/** HMAC secret for member sessions; created (and persisted) on first use. */
export function sessionSecret(): string {
  const data = readRaw();
  if (!fs.existsSync(file())) writeRaw(data);
  return data.sessionSecret;
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase();

export function findAccountByEmail(email: string): MemberAccount | undefined {
  const e = normaliseEmail(email);
  return readRaw().accounts.find((a) => a.email === e);
}

/** All accounts (read-only snapshot). */
export function readAccounts(): MemberAccount[] {
  return readRaw().accounts;
}

export function findAccountById(id: string): MemberAccount | undefined {
  return readRaw().accounts.find((a) => a.id === id);
}

// ---------------------------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------------------------

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

export function verifyPassword(password: string, stored: string | undefined): boolean {
  const [scheme, saltB64, hashB64] = (stored || DUMMY_HASH).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
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
// One-time tokens (email verification, password reset)
// ---------------------------------------------------------------------------------------------

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export type TokenKind = 'verify' | 'reset';
const TTL: Record<TokenKind, number> = { verify: 48 * 3600_000, reset: 3600_000 };

/** Issues a fresh token (replacing any earlier one of the same kind) and returns the raw value. */
export function issueToken(accountId: string, kind: TokenKind): string | null {
  const raw = crypto.randomBytes(32).toString('base64url');
  const ok = mutateAccounts((data) => {
    const a = data.accounts.find((x) => x.id === accountId);
    if (!a) return false;
    const exp = new Date(Date.now() + TTL[kind]).toISOString();
    if (kind === 'verify') {
      a.verifyTokenHash = sha256(raw);
      a.verifyTokenExp = exp;
    } else {
      a.resetTokenHash = sha256(raw);
      a.resetTokenExp = exp;
    }
    return true;
  });
  return ok ? raw : null;
}

/** Finds the account a still-valid token belongs to (without consuming it). */
export function accountForToken(raw: string, kind: TokenKind): MemberAccount | undefined {
  if (!raw || raw.length > 100) return undefined;
  const h = sha256(raw);
  const now = Date.now();
  return readRaw().accounts.find((a) =>
    kind === 'verify'
      ? a.verifyTokenHash === h && Date.parse(a.verifyTokenExp || '') > now
      : a.resetTokenHash === h && Date.parse(a.resetTokenExp || '') > now
  );
}

// ---------------------------------------------------------------------------------------------
// Membership (application status lives in the private store, linked by verified email)
// ---------------------------------------------------------------------------------------------

export function membershipFor(account: Pick<MemberAccount, 'email' | 'emailVerifiedAt'>): CommunityMemberApplication | undefined {
  if (!account.emailVerifiedAt) return undefined;
  return readPrivate().members.find((m) => m.email.toLowerCase() === account.email);
}

/** Members-only access: verified email + an approved, paid and unexpired membership. */
export function isApprovedMember(account: Pick<MemberAccount, 'email' | 'emailVerifiedAt'> | null | undefined): boolean {
  const app = account ? membershipFor(account) : undefined;
  return !!app && membershipState(app) === 'active';
}

/** The account as the browser may see it. */
export function publicAccount(a: MemberAccount) {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    mobile: a.mobile,
    emailVerified: !!a.emailVerifiedAt,
    isMember: isApprovedMember(a),
    photoUrl: a.profile.photoUrl,
  };
}
export type PublicAccount = ReturnType<typeof publicAccount>;
