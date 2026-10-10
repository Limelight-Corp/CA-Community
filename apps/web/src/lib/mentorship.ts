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
import { mutatePrivate, newId, readPrivate } from './community-store';
import { adminRecipients, adminUrl, emailBrand, queueMail } from './mailer';
import type { MemberAccount } from './member-accounts';
import { siteUrl } from './seo';

/** Mentees a mentor is currently guiding. */
export function activeMenteeCount(mentorId: string, requests = readPrivate().mentorshipRequests): number {
  return requests.filter((r) => r.mentorId === mentorId && r.status === 'matched').length;
}

export function myMentorProfile(account: MemberAccount): MentorProfile | undefined {
  return readPrivate().mentors.find((m) => m.accountId === account.id);
}

export function myRequests(account: MemberAccount): MentorshipRequest[] {
  return readPrivate()
    .mentorshipRequests.filter((r) => r.accountId === account.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Approved mentors with their current load (members-only view). */
export function approvedMentors(): (MentorProfile & { activeMentees: number })[] {
  const data = readPrivate();
  return data.mentors
    .filter((m) => m.status === 'approved')
    .map((m) => ({ ...m, activeMentees: activeMenteeCount(m.id, data.mentorshipRequests) }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
export function saveMentorProfile(account: MemberAccount, input: MentorInput): { profile: MentorProfile; created: boolean } {
  const result = mutatePrivate((d) => {
    const stamp = new Date().toISOString();
    const existing = d.mentors.find((m) => m.accountId === account.id);
    if (existing) {
      Object.assign(existing, input, {
        name: account.name,
        email: account.email,
        mobile: account.mobile,
        status: existing.status === 'rejected' ? 'pending' : existing.status,
        updatedAt: stamp,
      });
      return { profile: { ...existing }, created: false };
    }
    const profile: MentorProfile = {
      id: newId('mentor'),
      accountId: account.id,
      name: account.name,
      email: account.email,
      mobile: account.mobile,
      ...input,
      status: 'pending',
      createdAt: stamp,
      updatedAt: stamp,
    };
    d.mentors.push(profile);
    return { profile, created: true };
  });
  if (result.created) {
    queueMail(
      adminRecipients(),
      adminMentorshipEmail(
        emailBrand(),
        { kind: 'mentor', name: account.name, email: account.email, summary: `${account.name} applied to mentor: ${input.headline}. Expertise: ${input.expertise.join(', ')}.` },
        adminUrl('/mentorship')
      ),
      { replyTo: account.email }
    );
  }
  return result;
}

/** A mentor pauses / resumes taking new mentees (only once approved). */
export function setMentorAvailability(account: MemberAccount, available: boolean): MentorProfile | null {
  return mutatePrivate((d) => {
    const m = d.mentors.find((x) => x.accountId === account.id);
    if (!m || (m.status !== 'approved' && m.status !== 'paused')) return null;
    m.status = available ? 'approved' : 'paused';
    m.updatedAt = new Date().toISOString();
    return { ...m };
  });
}

export interface RequestInput {
  stage: MentorshipStage;
  goals: string;
  wings: number[];
  preferredMentorId?: string;
}

export type CreateRequestResult = { ok: true; request: MentorshipRequest } | { ok: false; error: string };

/** One open request at a time; the preferred mentor (if any) must be an approved mentor other than yourself. */
export function createRequest(account: MemberAccount, input: RequestInput): CreateRequestResult {
  const result = mutatePrivate<CreateRequestResult>((d) => {
    if (d.mentorshipRequests.some((r) => r.accountId === account.id && r.status === 'open')) {
      return { ok: false, error: 'You already have an open request. We will match you soon — or withdraw it to send a new one.' };
    }
    let preferred: string | undefined;
    if (input.preferredMentorId) {
      const m = d.mentors.find((x) => x.id === input.preferredMentorId && x.status === 'approved');
      if (!m || m.accountId === account.id) return { ok: false, error: 'Choose a mentor from the list.' };
      preferred = m.id;
    }
    const stamp = new Date().toISOString();
    const request: MentorshipRequest = {
      id: newId('mreq'),
      accountId: account.id,
      name: account.name,
      email: account.email,
      mobile: account.mobile,
      stage: input.stage,
      goals: input.goals,
      wings: input.wings,
      preferredMentorId: preferred,
      status: 'open',
      createdAt: stamp,
      updatedAt: stamp,
    };
    d.mentorshipRequests.push(request);
    return { ok: true, request };
  });
  if (result.ok) {
    const brand = emailBrand();
    queueMail(account.email, mentorshipRequestReceivedEmail(brand, { name: account.name, dashboardUrl: `${siteUrl()}/dashboard?tab=mentorship` }));
    queueMail(
      adminRecipients(),
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
export function withdrawRequest(account: MemberAccount, id: string): boolean {
  return mutatePrivate((d) => {
    const r = d.mentorshipRequests.find((x) => x.id === id && x.accountId === account.id && x.status === 'open');
    if (!r) return false;
    r.status = 'closed';
    r.adminNote = 'Withdrawn by the member';
    r.updatedAt = new Date().toISOString();
    return true;
  });
}
