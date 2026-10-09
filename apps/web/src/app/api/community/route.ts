import { NextRequest, NextResponse } from 'next/server';
import {
  readStore,
  getItems,
  addItem,
  updateItem,
  deleteItem,
  ContentType,
} from '../../../lib/community-store';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as ContentType | null;
    const publishedOnly = searchParams.get('publishedOnly') === 'true';

    if (type) {
      const items = getItems(type, publishedOnly);
      return NextResponse.json(
        { success: true, type, count: items.length, data: items },
        { headers: corsHeaders }
      );
    }

    const allData = readStore();
    if (publishedOnly) {
      return NextResponse.json(
        {
          success: true,
          data: {
            events: (allData.events || []).filter((x) => x.isPublished !== false),
            gallery: (allData.gallery || []).filter((x) => x.isPublished !== false),
            speakers: (allData.speakers || []).filter((x) => x.isPublished !== false),
            wings: (allData.wings || []).filter((x) => x.isPublished !== false),
            news: (allData.news || []).filter((x) => x.isPublished !== false),
            resources: (allData.resources || []).filter((x) => x.isPublished !== false),
          },
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, data: allData },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, item } = body;

    if (!type || !item) {
      return NextResponse.json(
        { success: false, error: 'Type and item are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const created = addItem(type, item);
    return NextResponse.json(
      { success: true, item: created },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, updates } = body;

    if (!type || !id || !updates) {
      return NextResponse.json(
        { success: false, error: 'Type, id, and updates are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const updated = updateItem(type, id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, item: updated },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let type: ContentType | null = null;
    let id: string | null = null;

    const { searchParams } = new URL(request.url);
    type = searchParams.get('type') as ContentType | null;
    id = searchParams.get('id');

    if (!type || !id) {
      try {
        const body = await request.json();
        type = body.type;
        id = body.id;
      } catch {
        // Body was empty or invalid JSON, rely on query params
      }
    }

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Type and id are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const deleted = deleteItem(type, id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, deleted: true, id },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
