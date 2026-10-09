import { readPrivate } from '../../lib/community-store';
import { AdminShell } from '../../components/shell/AdminShell';

export const dynamic = 'force-dynamic';

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const priv = readPrivate();
  const counts = {
    pendingMembers: priv.members.filter((m) => m.status === 'pending').length,
    unreadMessages: priv.messages.filter((m) => m.status === 'new').length,
    pendingPayments: priv.registrations.filter((r) => r.paymentStatus === 'pending' && r.status !== 'cancelled').length,
  };
  return <AdminShell counts={counts}>{children}</AdminShell>;
}
