/**
 * Runs once when the web server starts. Schedules the hourly event-reminder run on long-lived
 * Node servers (`next start`). Serverless hosts should call GET /api/cron/reminders instead;
 * set REMINDER_SCHEDULER=off there to skip the in-process timer.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.REMINDER_SCHEDULER === 'off') return;
  const { sendDueReminders } = await import('./lib/reminders');
  const run = () => {
    try {
      const result = sendDueReminders();
      if (result.sent) console.log(`[reminders] sent ${result.sent} reminder(s): ${result.bookings.join(', ')}`);
    } catch (err) {
      console.error('[reminders] run failed:', err);
    }
  };
  setTimeout(run, 60_000); // first run a minute after start-up
  setInterval(run, 60 * 60_000).unref?.();
}
