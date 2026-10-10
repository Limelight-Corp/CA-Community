import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Admin image upload. Reachable only through the admin access gate (see src/middleware.ts).
 *
 * Accepts raster images only (PNG, JPEG, WebP, GIF), detected from the file's
 * magic bytes rather than the client-supplied name or MIME type. SVG and every
 * other type are rejected because they can carry active content when served from
 * the public site. Files are stored under a random name with the extension of the
 * detected type.
 *
 * `?type=document` accepts resource files instead (PDF, Word, Excel, PowerPoint, up to 15 MB).
 * Those go to data/resource-files — outside any public folder — and the website serves them
 * through /api/resources/[id]/download, which enforces members-only access.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DOC_BYTES = 15 * 1024 * 1024;

const DOC_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/** Detects a document from its magic bytes; Office formats also need a matching file extension. */
function detectDocument(buf: Buffer, name: string): ImageKind | null {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') return { ext: 'pdf', mime: 'application/pdf' };
  const isZip = buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
  if (isZip && ['docx', 'xlsx', 'pptx'].includes(ext)) return { ext, mime: DOC_MIME[ext] ?? 'application/octet-stream' };
  const isOle = buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (isOle && ['doc', 'xls', 'ppt'].includes(ext)) return { ext, mime: DOC_MIME[ext] ?? 'application/octet-stream' };
  return null;
}

type ImageKind = { ext: string; mime: string };

function detectImage(buf: Buffer): ImageKind | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.toString('ascii', 0, 6))) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  return null;
}

function findWorkspaceRoot(): string {
  let root = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(root, 'apps', 'admin')) && fs.existsSync(path.join(root, 'apps', 'web'))) {
      return root;
    }
    const parent = path.dirname(root);
    if (parent === root) break;
    root = parent;
  }
  return root;
}

export async function POST(request: NextRequest) {
  if (request.nextUrl.searchParams.get('type') === 'document') return uploadDocument(request);
  try {
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_BYTES + 64 * 1024) {
      return NextResponse.json({ success: false, error: 'File exceeds the 5 MB limit' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ success: false, error: 'File is empty' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File exceeds the 5 MB limit' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = detectImage(buffer);
    if (!kind) {
      return NextResponse.json(
        { success: false, error: 'Only PNG, JPEG, WebP or GIF images are allowed' },
        { status: 415 }
      );
    }

    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${kind.ext}`;

    // Both apps serve the same uploads: the admin for previews, the website for visitors.
    const root = findWorkspaceRoot();
    const targetDirs = [
      path.join(root, 'apps', 'admin', 'public', 'uploads'),
      path.join(root, 'apps', 'web', 'public', 'uploads'),
    ];

    for (const dir of targetDirs) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, safeName), buffer, { flag: 'wx' });
    }

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeName}`,
      filename: safeName,
      size: file.size,
      type: kind.mime,
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}

async function uploadDocument(request: NextRequest) {
  try {
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_DOC_BYTES + 64 * 1024) {
      return NextResponse.json({ success: false, error: 'File exceeds the 15 MB limit' }, { status: 413 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ success: false, error: 'File is empty' }, { status: 400 });
    }
    if (file.size > MAX_DOC_BYTES) {
      return NextResponse.json({ success: false, error: 'File exceeds the 15 MB limit' }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const kind = detectDocument(buffer, file.name);
    if (!kind) {
      return NextResponse.json(
        { success: false, error: 'Only PDF, Word, Excel or PowerPoint files are allowed' },
        { status: 415 }
      );
    }

    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${kind.ext}`;
    const dir = path.join(findWorkspaceRoot(), 'data', 'resource-files');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, safeName), buffer, { flag: 'wx' });

    return NextResponse.json({
      success: true,
      url: `/resource-files/${safeName}`,
      filename: safeName,
      size: file.size,
      type: kind.mime,
    });
  } catch (error) {
    console.error('Document upload failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
  }
}
