import type { Metadata } from 'next';
import { AdminLoginForm } from '../../components/auth/AdminLoginForm';
import { gateConfig, safeNextPath } from '../../lib/admin-session';

export const metadata: Metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AdminLoginForm
      next={safeNextPath(Array.isArray(next) ? next[0] : next)}
      configured={gateConfig() !== null}
    />
  );
}
