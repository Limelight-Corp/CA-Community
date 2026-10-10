import type { NextRequest } from 'next/server';
import { json, sameOrigin } from '../../../../lib/auth-server';
import { clearSessionCookie } from '../../../../lib/member-session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const res = json({ ok: true });
  clearSessionCookie(res);
  return res;
}
