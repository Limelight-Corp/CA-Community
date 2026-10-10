import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import type { CommunityResource } from '@ascend/shared';
import { dataDir, getItems, updateItem } from '../../../../../lib/community-store';
import { safeUrl } from '../../../../../lib/content';
import { isApprovedMember } from '../../../../../lib/member-accounts';
import { loginUrl, memberFromRequest } from '../../../../../lib/member-session';

export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** Uploaded files are stored as `/resource-files/<random>.<ext>` (see the admin upload route). */
const UPLOADED = /^\/resource-files\/([0-9]+-[a-f0-9]{12}\.(pdf|docx?|xlsx?|pptx?))$/;

function fileName(title: string, ext: string): string {
  const base = title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'resource';
  return `${base}.${ext}`;
}

/**
 * Opens a resource: streams an uploaded file or redirects to its external link.
 * Members-only resources need an approved membership; visitors are sent to log in first.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resource = getItems<CommunityResource>('resources', true).find((r) => r.id === id);
  if (!resource || !resource.fileUrl) {
    return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
  }

  if (resource.isMembersOnly) {
    const account = memberFromRequest(request);
    if (!account) return NextResponse.redirect(new URL(loginUrl('/resources'), request.url));
    // Signed in but not (yet) an approved member → the dashboard explains the membership status.
    if (!isApprovedMember(account)) return NextResponse.redirect(new URL('/dashboard?tab=membership', request.url));
  }

  const uploaded = UPLOADED.exec(resource.fileUrl);
  let response: NextResponse;
  if (uploaded) {
    const file = path.join(dataDir(), 'resource-files', uploaded[1]!);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ success: false, error: 'File is no longer available' }, { status: 404 });
    }
    const ext = uploaded[2]!;
    response = new NextResponse(new Uint8Array(fs.readFileSync(file)), {
      headers: {
        'Content-Type': MIME[ext] ?? 'application/octet-stream',
        // PDFs open in the browser; Office files download.
        'Content-Disposition': `${ext === 'pdf' ? 'inline' : 'attachment'}; filename="${fileName(resource.title, ext)}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': resource.isMembersOnly ? 'private, no-store' : 'public, max-age=300',
      },
    });
  } else {
    const target = safeUrl(resource.fileUrl);
    if (!target) return NextResponse.json({ success: false, error: 'Resource link is invalid' }, { status: 404 });
    response = NextResponse.redirect(new URL(target, request.url));
  }

  try {
    updateItem('resources', resource.id, { downloads: (resource.downloads ?? 0) + 1 });
  } catch (err) {
    console.error('Failed to count resource download:', err);
  }
  return response;
}
