import type { Metadata } from 'next';
import { readStore } from '../../../lib/community-store';
import { PageHeader } from '../../../components/ui/Display';
import { CheckinScanner } from '../../../components/checkin/CheckinScanner';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Check-in' };

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const sp = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const events = [...readStore().events].sort((a, b) => a.date.localeCompare(b.date));
  // Default to today's event, else the next upcoming one, else the most recent.
  const preferred =
    events.find((e) => e.id === sp.event) ??
    events.find((e) => e.date === today) ??
    events.find((e) => e.date > today) ??
    events.at(-1);

  return (
    <>
      <PageHeader
        eyebrow="Event day"
        title="Scan attendee"
        accent="QR."
        description="Point the camera at the ticket QR on the attendee’s phone or print-out — they’re checked in instantly and their certificate is issued. No camera? Type the booking ID."
      />
      <CheckinScanner
        events={events.map((e) => ({ id: e.id, title: e.title, date: e.date, city: e.mode === 'Online' ? 'Online' : e.city }))}
        initialEventId={preferred?.id}
      />
    </>
  );
}
