import { NextRequest, NextResponse } from 'next/server';
import { bad } from '../../../../lib/api-helpers';
import { SESSION_COOKIE } from '../../../../lib/admin-session';
import { sameOrigin } from '../same-origin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return bad('Cross-site request blocked.', 403);
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return res;
}
