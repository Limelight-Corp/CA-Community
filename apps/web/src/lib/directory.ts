/**
 * Members-only directory (server only). Lists active (approved + paid) members with a confirmed email who have
 * opted in from their dashboard. Contact details (email, phone, membership number) are never
 * exposed — members connect through LinkedIn.
 */
import { MEMBERSHIP_PLANS, membershipState, wingSlug, type OrgWing } from '@ascend/shared';
import { siteWings } from './taxonomy';
import { readPrivate } from './community-store';
import { readAccounts } from './member-accounts';

export interface DirectoryEntry {
  id: string;
  name: string;
  photoUrl?: string;
  designation?: string;
  organisation?: string;
  city?: string;
  areaOfPractice?: string;
  qualificationYear?: string;
  bio?: string;
  linkedinUrl?: string;
  plan: string;
  wings: { number: number; name: string; slug: string }[];
}

export function directoryEntries(): DirectoryEntry[] {
  const wings = siteWings();
  const approved = new Map(
    readPrivate()
      .members.filter((m) => membershipState(m) === 'active')
      .map((m) => [m.email.toLowerCase(), m])
  );
  return readAccounts()
    .filter((a) => a.emailVerifiedAt && a.profile.directoryOptIn && approved.has(a.email))
    .map((a) => {
      const app = approved.get(a.email)!;
      return {
        id: a.id,
        name: a.name,
        photoUrl: a.profile.photoUrl,
        designation: a.profile.designation,
        organisation: a.profile.organisation,
        city: a.profile.city || app.city,
        areaOfPractice: a.profile.areaOfPractice || app.areaOfPractice,
        qualificationYear: a.profile.qualificationYear || app.qualificationYear,
        bio: a.profile.bio,
        linkedinUrl: a.profile.linkedinUrl || app.linkedinUrl,
        plan: MEMBERSHIP_PLANS.find((p) => p.key === app.plan)?.name ?? app.plan,
        wings: (app.interests ?? [])
          .map((n) => wings.find((w) => w.number === n))
          .filter((w): w is OrgWing => !!w)
          .map((w) => ({ number: w.number, name: w.name, slug: wingSlug(w.name) })),
      };
    })
    .sort((x, y) => x.name.replace(/^CA\s+/i, '').localeCompare(y.name.replace(/^CA\s+/i, '')));
}
