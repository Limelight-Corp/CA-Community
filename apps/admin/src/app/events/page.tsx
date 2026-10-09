import { redirect } from 'next/navigation';

export default function EventsAdminRedirect() {
  redirect('/dashboard');
}
