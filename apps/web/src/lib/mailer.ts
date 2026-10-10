import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailBrand, EmailMessage } from '@ascend/shared';
import { dataDir, getSettings } from './community-store';
import { siteUrl } from './seo';

/**
 * Transactional email (server only).
 *
 * With SMTP_HOST set, mail goes out over SMTP (SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
 * Without it, every message is written to data/outbox/ instead (an .html preview plus a .json
 * record) so the flows can be tested locally. MAIL_OUTBOX=off disables the outbox.
 * Sending never throws into the caller's request: use `queueMail` from route handlers.
 * Keep this file in sync with apps/admin/src/lib/mailer.ts.
 */

export function mailConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

let transporter: Transporter | null = null;
function smtp(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
    });
  }
  return transporter;
}

export function emailBrand(): EmailBrand {
  const s = getSettings();
  return { siteName: s.siteName, siteUrl: siteUrl(), contactEmail: s.contact?.email || undefined };
}

/** Admin notification recipients: ADMIN_NOTIFY_EMAIL (comma-separated), else the site contact email. */
export function adminRecipients(): string[] {
  const list = (process.env.ADMIN_NOTIFY_EMAIL || getSettings().contact?.email || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x));
  return [...new Set(list)];
}

/** Admin console origin, for "Open in admin" links in notifications. */
export function adminUrl(pathname = ''): string {
  return `${(process.env.ADMIN_APP_URL || 'http://localhost:3001').replace(/\/+$/, '')}${pathname}`;
}

function fromAddress(): string {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const name = getSettings().siteName.replace(/["<>]/g, '');
  return `"${name}" <${process.env.SMTP_USER || 'no-reply@localhost'}>`;
}

function writeOutbox(to: string[], msg: EmailMessage, replyTo?: string): void {
  if (process.env.MAIL_OUTBOX === 'off') return;
  const dir = path.join(dataDir(), 'outbox');
  fs.mkdirSync(dir, { recursive: true });
  const slug = msg.subject.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50).replace(/-+$/, '');
  const base = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}-${slug}`;
  const record = { to, from: fromAddress(), replyTo, subject: msg.subject, text: msg.text, createdAt: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, `${base}.json`), JSON.stringify(record, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dir, `${base}.html`), msg.html, 'utf-8');
}

export async function sendMail(to: string | string[], msg: EmailMessage, opts: { replyTo?: string } = {}): Promise<void> {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return;
  if (!mailConfigured()) {
    writeOutbox(recipients, msg, opts.replyTo);
    return;
  }
  await smtp().sendMail({
    from: fromAddress(),
    to: recipients.join(', '),
    replyTo: opts.replyTo,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  });
}

/** Fire-and-forget send: failures are logged, never thrown into the request. */
export function queueMail(to: string | string[], msg: EmailMessage, opts: { replyTo?: string } = {}): void {
  sendMail(to, msg, opts).catch((err) => console.error(`Email "${msg.subject}" failed:`, err instanceof Error ? err.message : err));
}
