import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { dataDir } from '../../../../../lib/community-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

/** Serves a member profile photo by its random file name. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^[\w-]+\.(png|jpg|webp)$/.exec(file);
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const p = path.join(dataDir(), 'member-photos', file);
  if (!fs.existsSync(p)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(p)), {
    headers: {
      'Content-Type': TYPES[m[1]!]!,
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
