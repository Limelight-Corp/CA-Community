import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { WHATSAPP_TEMPLATES, waNumber, type WhatsAppMessage } from '@ascend/shared';
import { dataDir } from './community-store';

/**
 * WhatsApp notifications through Meta's WhatsApp Cloud API (server only).
 *
 * Enabled when WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set. WHATSAPP_DRY_RUN=true turns
 * the feature on (opt-in shown, messages composed) but only writes them to data/outbox/ — for
 * testing before the templates are approved. Failed sends are also kept in the outbox.
 * Messages go only to registrants who opted in. Keep in sync with apps/web/src/lib/whatsapp.ts.
 */

const dryRun = () => process.env.WHATSAPP_DRY_RUN === 'true';

export function whatsappEnabled(): boolean {
  return dryRun() || !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

function templateName(key: WhatsAppMessage['template']): string {
  return process.env[`WHATSAPP_TPL_${key.toUpperCase()}`] || key;
}

function writeOutbox(to: string, msg: WhatsAppMessage, error?: string): void {
  if (process.env.MAIL_OUTBOX === 'off') return;
  const dir = path.join(dataDir(), 'outbox');
  fs.mkdirSync(dir, { recursive: true });
  const base = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}-whatsapp-${msg.template}`;
  const tpl = WHATSAPP_TEMPLATES[msg.template];
  const preview = tpl.body.replace(/\{\{(\d+)\}\}/g, (_, n: string) => msg.params[Number(n) - 1] ?? '');
  fs.writeFileSync(
    path.join(dir, `${base}.json`),
    JSON.stringify({ channel: 'whatsapp', to, template: templateName(msg.template), params: msg.params, preview, error, createdAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
}

export async function sendWhatsApp(mobile: string | undefined, msg: WhatsAppMessage): Promise<void> {
  const to = waNumber(mobile);
  if (!to || !whatsappEnabled()) return;
  if (dryRun()) {
    writeOutbox(to, msg);
    return;
  }
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName(msg.template),
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [{ type: 'body', parameters: msg.params.map((text) => ({ type: 'text', text })) }],
        },
      }),
      cache: 'no-store',
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new Error(`HTTP ${res.status}: ${data.error?.message ?? 'request failed'}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    writeOutbox(to, msg, message);
    throw err;
  }
}

/** Fire-and-forget: failures are logged (and kept in the outbox), never thrown into the request. */
export function queueWhatsApp(mobile: string | undefined, msg: WhatsAppMessage): void {
  sendWhatsApp(mobile, msg).catch((err) => console.error(`WhatsApp "${msg.template}" failed:`, err instanceof Error ? err.message : err));
}
