import type { Metadata } from 'next';
import { Clock, HeartHandshake, UserRoundCheck, Users } from 'lucide-react';
import { readPrivate } from '../../../lib/community-store';
import { activeMentees } from '../../../lib/mentorship';
import { adminWings, wingLabel } from '../../../lib/taxonomy';
import { PageHeader, Panel, StatCard } from '../../../components/ui/Display';
import { MentorshipAdmin } from '../../../components/mentorship/MentorshipAdmin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mentorship' };


export default function MentorshipAdminPage() {
  const { mentors, mentorshipRequests: requests } = readPrivate();
  const wings = adminWings();
  const wingName = (n: number) => wingLabel(wings, n);
  const mentorRows = [...mentors]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      headline: m.headline,
      expertise: m.expertise,
      wings: m.wings.map(wingName),
      modes: m.modes,
      city: m.city,
      capacity: m.capacity,
      active: activeMentees(m.id, requests),
      status: m.status,
      createdAt: m.createdAt,
    }));
  const byId = new Map(mentors.map((m) => [m.id, m.name]));
  const requestRows = [...requests]
    .sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.createdAt.localeCompare(a.createdAt))
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      stage: r.stage,
      goals: r.goals,
      wings: r.wings.map(wingName),
      preferredMentorId: r.preferredMentorId,
      preferredMentor: r.preferredMentorId ? byId.get(r.preferredMentorId) : undefined,
      mentorName: r.mentorId ? byId.get(r.mentorId) : undefined,
      accountId: r.accountId,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt,
    }));
  const accountOf = Object.fromEntries(mentors.map((m) => [m.id, m.accountId]));

  return (
    <>
      <PageHeader
        eyebrow="Programmes"
        title="Mentorship"
        accent="matches."
        description="Approve mentors, then match each request with a mentor who has a free spot. Both sides get an email introduction."
      />
      <section aria-label="Mentorship summary" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open requests" value={requests.filter((r) => r.status === 'open').length} tone="gold" icon={<Clock />} />
        <StatCard label="Active matches" value={requests.filter((r) => r.status === 'matched').length} tone="ok" icon={<HeartHandshake />} />
        <StatCard label="Active mentors" value={mentors.filter((m) => m.status === 'approved').length} icon={<UserRoundCheck />} />
        <StatCard label="Mentors to review" value={mentors.filter((m) => m.status === 'pending').length} tone="blue" icon={<Users />} />
      </section>
      <Panel>
        <MentorshipAdmin mentors={mentorRows} requests={requestRows} mentorAccounts={accountOf} />
      </Panel>
    </>
  );
}
