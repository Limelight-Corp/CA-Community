import { json } from '../../../../lib/auth-server';
import { publicAccount } from '../../../../lib/member-accounts';
import { memberFromRequest } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The signed-in member (or null). */
export async function GET(req: Request) {
  const account = await memberFromRequest(req);
  return json({ user: account ? await publicAccount(account) : null });
}
