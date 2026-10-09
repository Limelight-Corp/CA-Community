import { NextResponse } from 'next/server';

/** Liveness probe for container orchestration. Deliberately outside the admin access gate. */
export function GET() {
  return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
