import { notFound } from 'next/navigation';
import { getItems } from '../../../../../lib/community-store';
import { CONTENT_TYPES, isManagedContentType } from '../../../../../lib/content-config';
import { PageHeader } from '../../../../../components/ui/Display';
import { ContentForm } from '../../../../../components/content/ContentForm';

export const dynamic = 'force-dynamic';

export default async function NewContentPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isManagedContentType(type)) notFound();
  const config = CONTENT_TYPES[type];
  if (!config.allowCreate) notFound();
  const takenSlugs = getItems<{ slug?: string }>(type)
    .map((x) => x.slug)
    .filter((s): s is string => Boolean(s));
  return (
    <>
      <PageHeader eyebrow={config.label} title={`New ${config.singular.toLowerCase()}`} backHref={`/content/${type}`} backLabel={config.label} />
      <ContentForm type={type} takenSlugs={takenSlugs} />
    </>
  );
}
