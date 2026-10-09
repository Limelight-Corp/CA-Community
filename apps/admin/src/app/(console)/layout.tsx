import { readPrivate } from '../../lib/community-store';
import { AdminShell } from '../../components/shell/AdminShell';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, gateBypassed, verifySessionToken } from '../../lib/admin-session';

export const dynamic = 'force-dynamic';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const priv = readPrivate();
  const counts = {
    pendingMembers: priv.members.filter((m) => m.status === 'pending').length,
    unreadMessages: priv.messages.filter((m) => m.status === 'new').length,
    pendingPayments: priv.registrations.filter((r) => r.paymentStatus === 'pending' && r.status !== 'cancelled').length,
  };
  // Middleware already admitted this request; the session only tells us who is signed in.
  const identity = gateBypassed() ? null : await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  const admin = gateBypassed() ? null : { name: identity?.name ?? 'Admin', role: identity?.role ?? 'admin' };
  return (
    <AdminShell counts={counts} admin={admin}>
      {children}
    </AdminShell>
  );
}
