import { redirect } from 'next/navigation';

/** Membership now lives on the Join Us page. */
export default function MembershipRedirect(): never {
  redirect('/join');
}
