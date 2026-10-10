import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MemberDashboard } from '../../components/dashboard/MemberDashboard';
import { dashboardData } from '../../lib/member-dashboard';
import { currentMember, loginUrl } from '../../lib/member-session';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'My dashboard', robots: { index: false } };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const account = await currentMember();
  if (!account) redirect(loginUrl('/dashboard'));
  const { tab } = await searchParams;
  return <MemberDashboard data={dashboardData(account)} initialTab={tab === 'membership' ? 'overview' : tab} />;
}
