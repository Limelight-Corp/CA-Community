import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getItems } from '../../../../lib/community-store';
import { CONTENT_TYPES, isManagedContentType } from '../../../../lib/content-config';
import { PageHeader, Panel } from '../../../../components/ui/Display';
import { ContentList } from '../../../../components/content/ContentList';

export const dynamic = 'force-dynamic';

type Item = Record<string, unknown> & { id: string; isPublished?: boolean };

export default async function ContentTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isManagedContentType(type)) notFound();
  const config = CONTENT_TYPES[type];
  let items = getItems<Item>(type);
  if (type === 'team') {
    const groups = ['Leadership', 'Core Team', 'Advisory Board', 'Wing Conveners'];
    items = [...items].sort(
      (a, b) => groups.indexOf(String(a.group)) - groups.indexOf(String(b.group)) || (Number(a.order) || 0) - (Number(b.order) || 0)
    );
  } else if (type === 'wings') {
    items = [...items].sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0));
  }

  return (
    <>
      <PageHeader
        eyebrow="Website content"
        title={config.label}
        description={config.description}
        actions={
          config.allowCreate ? (
            <Link
              href={`/content/${type}/new`}
              className="inline-flex items-center gap-2 rounded-full bg-grad-primary px-5 py-3 text-[14px] font-semibold text-white shadow-[0_10px_28px_-12px_rgb(var(--lime-rgb)/0.9)] transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add {config.singular.toLowerCase()}
            </Link>
          ) : undefined
        }
      />
      <Panel>
        <ContentList type={type} items={items} />
      </Panel>
    </>
  );
}
