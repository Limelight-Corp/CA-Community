/** Mentorship programme — admin operations (server only). */
import {
  mentorApprovedEmail,
  mentorshipMatchedEmail,
  type MentorProfile,
  type MentorStatus,
  type MentorshipRequest,
  type MentorshipRequestStatus,
} from '@ascend/shared';
import { store } from './community-store';
import { ActionError } from './admin-data';
import { emailBrand, queueMail, siteUrl } from './mailer';

export const activeMentees = (mentorId: string, requests: MentorshipRequest[]) =>
  requests.filter((r) => r.mentorId === mentorId && r.status === 'matched').length;

export async function setMentorStatus(id: string, status: MentorStatus): Promise<MentorProfile> {
  const current = (await store.listMentors({ id }))[0];
  if (!current) throw new ActionError('Mentor not found', 404);
  const approvedNow = status === 'approved' && current.status === 'pending';
  const mentor = (await store.setMentorStatus(id, status))!;
  if (approvedNow) queueMail(mentor.email, mentorApprovedEmail(await emailBrand(), { name: mentor.name, dashboardUrl: `${siteUrl()}/dashboard?tab=mentorship` }));
  return mentor;
}

/** Matches an open request with an approved mentor who has a free spot, and introduces them by email. */
export async function matchRequest(requestId: string, mentorId: string): Promise<MentorshipRequest> {
  // Mentor and request rows locked: two admins cannot over-fill a mentor or match one request twice.
  const { request, mentor } = await store.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM mentors WHERE id = ${mentorId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM mentorship_requests WHERE id = ${requestId} FOR UPDATE`;
    const r = (await store.listMentorshipRequests({ id: requestId }, tx))[0];
    if (!r) throw new ActionError('Request not found', 404);
    if (r.status !== 'open') throw new ActionError('Only open requests can be matched', 409);
    const m = (await store.listMentors({ id: mentorId }, tx))[0];
    if (!m || m.status !== 'approved') throw new ActionError('Choose an active mentor', 409);
    if (m.accountId === r.accountId) throw new ActionError('A member cannot mentor themselves', 409);
    const load = await tx.mentorshipRequest.count({ where: { mentorId: m.id, status: 'MATCHED' } });
    if (load >= m.capacity) throw new ActionError(`${m.name} has no free mentee spots`, 409);
    const matched = (await store.updateMentorshipRequest(r.id, { status: 'matched', mentorId: m.id, matchedAt: new Date().toISOString() }, tx))!;
    return { request: matched, mentor: m };
  });
  const brand = await emailBrand();
  const dashboardUrl = `${siteUrl()}/dashboard?tab=mentorship`;
  queueMail(
    request.email,
    mentorshipMatchedEmail(brand, {
      to: 'mentee',
      recipientName: request.name,
      otherName: mentor.name,
      otherEmail: mentor.email,
      otherMobile: mentor.mobile,
      otherLinkedIn: mentor.linkedinUrl,
      otherHeadline: mentor.headline,
      goals: request.goals,
      dashboardUrl,
    }),
    { replyTo: mentor.email }
  );
  queueMail(
    mentor.email,
    mentorshipMatchedEmail(brand, {
      to: 'mentor',
      recipientName: mentor.name,
      otherName: request.name,
      otherEmail: request.email,
      otherMobile: request.mobile,
      otherHeadline: request.stage,
      goals: request.goals,
      dashboardUrl,
    }),
    { replyTo: request.email }
  );
  return request;
}

/** Decline / close / re-open a request (closing a matched one frees the mentor's spot). */
export async function setRequestStatus(id: string, status: Exclude<MentorshipRequestStatus, 'matched'>, note?: string): Promise<MentorshipRequest> {
  return store.prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM mentorship_requests WHERE id = ${id} FOR UPDATE`;
    const r = (await store.listMentorshipRequests({ id }, tx))[0];
    if (!r) throw new ActionError('Request not found', 404);
    if (status === 'open' && r.status === 'matched') throw new ActionError('Close the match first', 409);
    return (await store.updateMentorshipRequest(
      id,
      { status, ...(status === 'open' ? { mentorId: undefined } : {}), ...(note !== undefined ? { adminNote: note || undefined } : {}) },
      tx
    ))!;
  });
}
