import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Serves images uploaded from the admin console (public/uploads). `next start` only serves
 * public files that existed at build time, so uploads made later would otherwise 404.
 * Files present at build time are still served directly by Next.js before this route runs.
 */
const TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const name = decodeURIComponent(file);
  const m = /^[\w.-]+\.(png|jpe?g|webp|gif)$/i.exec(name);
  if (!m || name.includes('..')) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const full = path.join(process.cwd(), 'public', 'uploads', name);
  if (!fs.existsSync(full)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(fs.readFileSync(full)), {
    headers: {
      'Content-Type': TYPES[m[1]!.toLowerCase()]!,
      // Upload names are unique (timestamp + random), so they can be cached for a long time.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
