import { redirect } from 'next/navigation';

/**
 * Access to the admin console is enforced by the HTTP Basic access gate in src/middleware.ts,
 * so there is no separate sign-in screen. Old links to /login land on the dashboard.
 */
export default function AdminLoginRedirect() {
  redirect('/dashboard');
}
