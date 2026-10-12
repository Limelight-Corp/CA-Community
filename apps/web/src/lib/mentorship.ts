/**
 * Mentorship programme on the website (server only). Mentors and mentees are active members;
 * the team approves mentors and matches requests in the admin console.
 */
import {
  adminMentorshipEmail,
  mentorshipRequestReceivedEmail,
  type MentorProfile,
  type MentorshipRequest,
  type MentorshipStage,
} from '@ascend/shared';
import { store } from './community-store';
import { adminRecipients, adminUrl, emailBrand, queueMail } from './mailer';
import type { MemberAccount } from './member-accounts';
import { siteUrl } from './seo';

/** Mentees a mentor is currently guiding. */
export async function activeMenteeCount(mentorId: string): Promise<number> {
  return store.prisma.mentorshipRequest.count({ where: { mentorId, status: 'MATCHED' } });
}

export async function myMentorProfile(account: MemberAccount): Promise<MentorProfile | undefined> {
  return (await store.listMentors({ accountId: account.id }))[0];
}

export async function myRequests(account: MemberAccount): Promise<MentorshipRequest[]> {
  return (await store.listMentorshipRequests({ accountId: account.id })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Approved mentors with their current load (members-only view). */
export async function approvedMentors(): Promise<(MentorProfile & { activeMentees: number })[]> {
  const [mentors, load] = await Promise.all([
    store.listMentors({ status: 'APPROVED' }),
    store.prisma.mentorshipRequest.groupBy({ by: ['mentorId'], where: { status: 'MATCHED', mentorId: { not: null } }, _count: true }),
  ]);
  const count = new Map(load.map((l) => [l.mentorId, l._count]));
  return mentors.map((m) => ({ ...m, activeMentees: count.get(m.id) ?? 0 })).sort((a, b) => a.name.localeCompare(b.name));
}

export { wingName } from './taxonomy';

export interface MentorInput {
  headline: string;
  expertise: string[];
  wings: number[];
  modes: ('Online' | 'In person')[];
  city?: string;
  capacity: number;
  bio: string;
  linkedinUrl?: string;
}

/** Creates or updates the account's mentor profile. New / previously rejected profiles go to review. */
export async function saveMentorProfile(account: MemberAccount, input: MentorInput): Promise<{ profile: MentorProfile; created: boolean }> {
  // Name, email and mobile come from the account itself (joined in), so they never go stale.
  const existed = !!(await myMentorProfile(account));
  const profile = await store.saveMentor(account.id, input);
  const result = { profile, created: !existed };
  if (result.created) {
    queueMail(
      await adminRecipients(),
      adminMentorshipEmail(
        await emailBrand(),
        { kind: 'mentor', name: account.name, email: account.email, summary: `${account.name} applied to mentor: ${input.headline}. Expertise: ${input.expertise.join(', ')}.` },
        adminUrl('/mentorship')
      ),
      { replyTo: account.email }
    );
  }
  return result;
}

/** A mentor pauses / resumes taking new mentees (only once approved). */
export async function setMentorAvailability(account: MemberAccount, available: boolean): Promise<MentorProfile | null> {
  const m = await myMentorProfile(account);
  if (!m || (m.status !== 'approved' && m.status !== 'paused')) return null;
  return store.setMentorStatus(m.id, available ? 'approved' : 'paused');
}

export interface RequestInput {
  stage: MentorshipStage;
  goals: string;
  wings: number[];
  preferredMentorId?: string;
}

export type CreateRequestResult = { ok: true; request: MentorshipRequest } | { ok: false; error: string };

/** One open request at a time; the preferred mentor (if any) must be an approved mentor other than yourself. */
export async function createRequest(account: MemberAccount, input: RequestInput): Promise<CreateRequestResult> {
  const OPEN_ALREADY = 'You already have an open request. We will match you soon — or withdraw it to send a new one.';
  let result: CreateRequestResult;
  try {
    result = await store.prisma.$transaction(async (tx): Promise<CreateRequestResult> => {
      if (await tx.mentorshipRequest.count({ where: { accountId: account.id, status: 'OPEN' } })) return { ok: false, error: OPEN_ALREADY };
      let preferred: string | undefined;
      if (input.preferredMentorId) {
        const m = (await store.listMentors({ id: input.preferredMentorId, status: 'APPROVED' }, tx))[0];
        if (!m || m.accountId === account.id) return { ok: false, error: 'Choose a mentor from the list.' };
        preferred = m.id;
      }
      const request = await store.createMentorshipRequest(account.id, { stage: input.stage, goals: input.goals, wings: input.wings, preferredMentorId: preferred }, tx);
      return { ok: true, request };
    });
  } catch (err) {
    // The database allows one open request per member (two submits at once).
    if ((err as { code?: string }).code === 'P2002') result = { ok: false, error: OPEN_ALREADY };
    else throw err;
  }
  if (result.ok) {
    const brand = await emailBrand();
    queueMail(account.email, mentorshipRequestReceivedEmail(brand, { name: account.name, dashboardUrl: `${siteUrl()}/dashboard?tab=mentorship` }));
    queueMail(
      await adminRecipients(),
      adminMentorshipEmail(
        brand,
        { kind: 'request', name: account.name, email: account.email, summary: `${account.name} (${input.stage}) is looking for a mentor. Goals: ${input.goals}` },
        adminUrl('/mentorship')
      ),
      { replyTo: account.email }
    );
  }
  return result;
}

/** The mentee withdraws their own open request. */
export async function withdrawRequest(account: MemberAccount, id: string): Promise<boolean> {
  const { count } = await store.prisma.mentorshipRequest.updateMany({
    where: { id, accountId: account.id, status: 'OPEN' },
    data: { status: 'CLOSED', adminNote: 'Withdrawn by the member' },
  });
  return count === 1;
}
