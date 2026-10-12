import { NextRequest, NextResponse } from 'next/server';
import type { CommunityResource } from '@ascend/shared';
import { readStore, getItems, ContentType } from '../../../lib/community-store';
import { resourceDownloadUrl, safeUrl } from '../../../lib/content';

/**
 * Public, read-only content feed for the website.
 *
 * Security: this route is served on the public origin, so it never exposes
 * write methods (POST/PUT/DELETE are answered with 405 by Next.js) and only
 * returns published items. Content editing happens exclusively in the admin app.
 */

const CONTENT_TYPES: readonly ContentType[] = [
  'events',
  'gallery',
  'speakers',
  'wings',
  'news',
  'resources',
];

/**
 * Resources never carry their stored file path or external link: the link goes through the
 * download route, which enforces members-only access.
 */
function publicResource(r: CommunityResource): CommunityResource {
  return { ...r, fileUrl: safeUrl(r.fileUrl) ? resourceDownloadUrl(r.id) : undefined };
}

function isContentType(value: string | null): value is ContentType {
  return value !== null && (CONTENT_TYPES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type !== null) {
      if (!isContentType(type)) {
        return NextResponse.json({ success: false, error: 'Unknown content type' }, { status: 400 });
      }
      const items = type === 'resources' ? (await getItems<CommunityResource>(type, true)).map(publicResource) : await getItems(type, true);
      return NextResponse.json({ success: true, type, count: items.length, data: items });
    }

    const allData = await readStore();
    const published = <T extends { isPublished?: boolean }>(list: T[] | undefined) =>
      (list || []).filter((x) => x.isPublished !== false);

    return NextResponse.json({
      success: true,
      data: {
        events: published(allData.events),
        gallery: published(allData.gallery),
        speakers: published(allData.speakers),
        wings: published(allData.wings),
        news: published(allData.news),
        resources: published(allData.resources).map(publicResource),
      },
    });
  } catch (error) {
    console.error('Failed to read community content:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
