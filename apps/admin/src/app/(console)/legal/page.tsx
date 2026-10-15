import { LEGAL_DOCS, legalSectionsToText } from '@ascend/shared';
import { store } from '../../../lib/community-store';
import { PageHeader } from '../../../components/ui/Display';
import { LegalEditor, type LegalEditorDoc } from '../../../components/legal/LegalEditor';

export const dynamic = 'force-dynamic';

export default async function LegalPagesPage() {
  const saved = await store.listLegalDocuments().catch(() => []);
  const docs: LegalEditorDoc[] = LEGAL_DOCS.map((d) => {
    const s = saved.find((r) => r.slug === d.slug);
    const defaults = { title: d.title, summary: d.summary, content: legalSectionsToText(d.sections) };
    return {
      slug: d.slug,
      defaults,
      current: s ? { title: s.title, summary: s.summary, content: s.content } : defaults,
      edited: !!s,
      updatedAt: s?.updatedAt,
    };
  });
  return (
    <>
      <PageHeader
        eyebrow="Legal pages"
        title="Policies &"
        accent="terms."
        description="Privacy policy, terms, event registration terms, refund, payment and cookie policies shown on the website. Until you save a page it shows the default draft wording."
      />
      <LegalEditor docs={docs} />
    </>
  );
}
