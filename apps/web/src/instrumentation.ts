/**
 * Runs once when the web server starts. Schedules the hourly event-reminder run on long-lived
 * Node servers (`next start`). Serverless hosts should call GET /api/cron/reminders instead;
 * set REMINDER_SCHEDULER=off there to skip the in-process timer.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.REMINDER_SCHEDULER === 'off') return;
  const { sendDueReminders, sendMembershipRenewalReminders } = await import('./lib/reminders');
  const run = () => {
    try {
      const result = sendDueReminders();
      if (result.sent) console.log(`[reminders] sent ${result.sent} reminder(s): ${result.bookings.join(', ')}`);
      const renewals = sendMembershipRenewalReminders();
      if (renewals.sent) console.log(`[reminders] sent ${renewals.sent} membership renewal reminder(s)`);
    } catch (err) {
      console.error('[reminders] run failed:', err);
    }
  };
  setTimeout(run, 60_000); // first run a minute after start-up
  setInterval(run, 60 * 60_000).unref?.();

  scheduleDailyBackup();
}

/**
 * Daily backup of the data folder via scripts/backup-data.mjs (BACKUP_SCHEDULER=off to disable,
 * e.g. when the host already backs up the disk). The first one runs 5 minutes after start-up.
 */
async function scheduleDailyBackup() {
  if (process.env.BACKUP_SCHEDULER === 'off') return;
  const path = await import('node:path');
  const fs = await import('node:fs');
  const { execFile } = await import('node:child_process');
  const script = [path.resolve(process.cwd(), '../../scripts/backup-data.mjs'), path.resolve(process.cwd(), 'scripts/backup-data.mjs')].find((p) =>
    fs.existsSync(p)
  );
  if (!script) return;
  const backup = () =>
    execFile(process.execPath, [script], { cwd: path.dirname(path.dirname(script)) }, (err, stdout, stderr) => {
      if (err) console.error('[backup] failed:', stderr || err.message);
      else console.log(`[backup] ${stdout.trim()}`);
    });
  setTimeout(backup, 5 * 60_000);
  setInterval(backup, 24 * 60 * 60_000).unref?.();
}
