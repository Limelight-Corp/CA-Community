import { notFound } from 'next/navigation';
import { getItems } from '../../../../../lib/community-store';
import { CONTENT_TYPES, isManagedContentType } from '../../../../../lib/content-config';
import { fieldOptions } from '../../../../../lib/taxonomy';
import { PageHeader } from '../../../../../components/ui/Display';
import { ContentForm } from '../../../../../components/content/ContentForm';

export const dynamic = 'force-dynamic';

type Item = Record<string, unknown> & { id: string; slug?: string; updatedAt?: string };

export default async function EditContentPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!isManagedContentType(type)) notFound();
  const config = CONTENT_TYPES[type];
  const all = getItems<Item>(type);
  const item = all.find((x) => x.id === decodeURIComponent(id));
  if (!item) notFound();
  const takenSlugs = all
    .filter((x) => x.id !== item.id)
    .map((x) => x.slug)
    .filter((s): s is string => Boolean(s));
  return (
    <>
      <PageHeader
        eyebrow={`Edit ${config.singular.toLowerCase()}`}
        title={String(item[config.titleField] ?? config.singular)}
        backHref={`/content/${type}`}
        backLabel={config.label}
      />
      <ContentForm key={item.updatedAt ?? item.id} type={type} item={item} takenSlugs={takenSlugs} options={fieldOptions(type)} />
    </>
  );
}
