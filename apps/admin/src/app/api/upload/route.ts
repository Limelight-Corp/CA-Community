import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Accurately locate workspace root
    let root = process.cwd();
    for (let i = 0; i < 5; i++) {
      if (fs.existsSync(path.join(root, 'apps', 'admin')) && fs.existsSync(path.join(root, 'apps', 'web'))) {
        break;
      }
      const parent = path.dirname(root);
      if (parent === root) break;
      root = parent;
    }

    const candidateDirs = [
      path.join(root, 'apps', 'admin', 'public', 'uploads'),
      path.join(root, 'apps', 'web', 'public', 'uploads'),
    ];

    for (const dir of candidateDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const targetPath = path.join(dir, safeName);
        fs.writeFileSync(targetPath, buffer);
      } catch (e) {
        // ignore
      }
    }

    const publicUrl = `/uploads/${safeName}`;

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        filename: safeName,
        size: file.size,
        type: file.type,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500, headers: corsHeaders }
    );
  }
}
