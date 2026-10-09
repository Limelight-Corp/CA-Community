import { readPrivate } from '../../../lib/community-store';
import { byNewest } from '../../../lib/filters';
import { PageHeader, Panel } from '../../../components/ui/Display';
import { MessagesInbox } from '../../../components/messages/MessagesInbox';

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  const rows = [...readPrivate().messages].sort(byNewest);
  const unread = rows.filter((m) => m.status === 'new').length;
  return (
    <>
      <PageHeader
        eyebrow="Messages"
        title="Contact"
        accent="inbox."
        description={unread ? `${unread} unread message${unread === 1 ? '' : 's'} from the website contact form.` : 'Submissions from the website contact form.'}
      />
      <Panel>
        <MessagesInbox rows={rows} />
      </Panel>
    </>
  );
}
