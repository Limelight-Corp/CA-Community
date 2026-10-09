import { redirect } from 'next/navigation';

/** The 10 wings are presented on the About page. */
export default function WingsRedirect(): never {
  redirect('/about#wings');
}
