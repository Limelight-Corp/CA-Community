import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { NextRequest } from 'next/server';
import { rateLimit } from '../../../../lib/form-guard';
import { json, sameOrigin } from '../../../../lib/auth-server';
import { dataDir } from '../../../../lib/community-store';
import { mutateAccounts, publicAccount, type MemberAccount } from '../../../../lib/member-accounts';
import { memberFromRequest } from '../../../../lib/member-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX = 2 * 1024 * 1024;

/** Raster images only, detected from magic bytes (never SVG). */
function detect(buf: Buffer): string | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

const photoDir = () => path.join(dataDir(), 'member-photos');

/** Uploads / replaces the signed-in member's profile photo. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request.' }, 403);
  const account = memberFromRequest(req);
  if (!account) return json({ error: 'Please log in.' }, 401);
  if (!rateLimit(`photo:${account.id}`, 20, 60 * 60_000)) return json({ error: 'Too many uploads. Please try again later.' }, 429);
  if (Number(req.headers.get('content-length') || 0) > MAX + 64 * 1024) return json({ error: 'The photo must be under 2 MB.' }, 413);

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File) || file.size === 0) return json({ error: 'Choose a photo to upload.' }, 400);
  if (file.size > MAX) return json({ error: 'The photo must be under 2 MB.' }, 413);
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detect(buf);
  if (!ext) return json({ error: 'Use a JPG, PNG or WebP image.' }, 415);

  const name = `${account.id.replace(/[^a-z0-9-]/gi, '')}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.mkdirSync(photoDir(), { recursive: true });
  fs.writeFileSync(path.join(photoDir(), name), buf, { flag: 'wx' });

  let previous: string | undefined;
  const updated = mutateAccounts<MemberAccount | null>((data) => {
    const a = data.accounts.find((x) => x.id === account.id);
    if (!a) return null;
    previous = a.profile.photoUrl;
    a.profile = { ...a.profile, photoUrl: `/api/account/photo/${name}` };
    a.updatedAt = new Date().toISOString();
    return { ...a };
  });
  if (!updated) return json({ error: 'Account not found.' }, 404);
  // Remove the photo this one replaced.
  const old = previous?.match(/^\/api\/account\/photo\/([\w-]+\.(?:png|jpg|webp))$/)?.[1];
  if (old) fs.rm(path.join(photoDir(), old), { force: true }, () => {});
  return json({ user: publicAccount(updated) });
}
