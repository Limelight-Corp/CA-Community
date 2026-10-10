/** Mentorship programme — admin operations (server only). */
import {
  mentorApprovedEmail,
  mentorshipMatchedEmail,
  type MentorProfile,
  type MentorStatus,
  type MentorshipRequest,
  type MentorshipRequestStatus,
} from '@ascend/shared';
import { mutatePrivate } from './community-store';
import { ActionError } from './admin-data';
import { emailBrand, queueMail, siteUrl } from './mailer';

export const activeMentees = (mentorId: string, requests: MentorshipRequest[]) =>
  requests.filter((r) => r.mentorId === mentorId && r.status === 'matched').length;

export function setMentorStatus(id: string, status: MentorStatus): MentorProfile {
  let approvedNow = false;
  const mentor = mutatePrivate((d) => {
    const m = d.mentors.find((x) => x.id === id);
    if (!m) throw new ActionError('Mentor not found', 404);
    approvedNow = status === 'approved' && m.status === 'pending';
    m.status = status;
    m.updatedAt = new Date().toISOString();
    return { ...m };
  });
  if (approvedNow) queueMail(mentor.email, mentorApprovedEmail(emailBrand(), { name: mentor.name, dashboardUrl: `${siteUrl()}/dashboard?tab=mentorship` }));
  return mentor;
}

/** Matches an open request with an approved mentor who has a free spot, and introduces them by email. */
export function matchRequest(requestId: string, mentorId: string): MentorshipRequest {
  const { request, mentor } = mutatePrivate((d) => {
    const r = d.mentorshipRequests.find((x) => x.id === requestId);
    if (!r) throw new ActionError('Request not found', 404);
    if (r.status !== 'open') throw new ActionError('Only open requests can be matched', 409);
    const m = d.mentors.find((x) => x.id === mentorId);
    if (!m || m.status !== 'approved') throw new ActionError('Choose an active mentor', 409);
    if (m.accountId === r.accountId) throw new ActionError('A member cannot mentor themselves', 409);
    if (activeMentees(m.id, d.mentorshipRequests) >= m.capacity) throw new ActionError(`${m.name} has no free mentee spots`, 409);
    const stamp = new Date().toISOString();
    r.status = 'matched';
    r.mentorId = m.id;
    r.matchedAt = stamp;
    r.updatedAt = stamp;
    return { request: { ...r }, mentor: { ...m } };
  });
  const brand = emailBrand();
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
export function setRequestStatus(id: string, status: Exclude<MentorshipRequestStatus, 'matched'>, note?: string): MentorshipRequest {
  return mutatePrivate((d) => {
    const r = d.mentorshipRequests.find((x) => x.id === id);
    if (!r) throw new ActionError('Request not found', 404);
    if (status === 'open' && r.status === 'matched') throw new ActionError('Close the match first', 409);
    r.status = status;
    if (status === 'open') r.mentorId = undefined;
    if (note !== undefined) r.adminNote = note || undefined;
    r.updatedAt = new Date().toISOString();
    return { ...r };
  });
}
