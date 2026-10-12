import { getSettings } from '../../../lib/community-store';
import { PageHeader } from '../../../components/ui/Display';
import { SettingsForm } from '../../../components/settings/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        eyebrow="Site settings"
        title="Banners &"
        accent="contact."
        description="Homepage banner text, the announcement bar, contact details and social links."
      />
      <SettingsForm settings={settings} />
    </>
  );
}
