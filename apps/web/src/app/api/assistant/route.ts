import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clientIp, rateLimit, readJsonBody } from '../../../lib/form-guard';
import { runAssistant } from '../../../lib/assistant/agent';
import { sameOrigin } from '../../../lib/auth-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(40),
  page: z.string().max(200).optional(),
});

/** Website support assistant. Body: { messages: [{ role, content }], page? } → { reply, events, links, lead?, suggestions, mode } */
export async function POST(request: NextRequest) {
  // Only the website itself may use the assistant (blocks other sites embedding it).
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request.' }, { status: 403 });
  if (!(await rateLimit(`assistant:${clientIp(request)}`, 60, 10 * 60_000))) {
    return NextResponse.json({ error: 'You’re sending messages quickly — please wait a minute and try again.' }, { status: 429 });
  }
  const parsed = Body.safeParse(await readJsonBody(request, 64_000));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // Keep the most recent turns only, starting with a user turn.
  let history = parsed.data.messages.slice(-16);
  while (history.length && history[0]!.role !== 'user') history = history.slice(1);
  if (!history.length || history.at(-1)!.role !== 'user') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

  // A plain site path only — the value is shown to the model, so no free text.
  const page = parsed.data.page && /^[/][A-Za-z0-9/_-]{0,99}$/.test(parsed.data.page) ? parsed.data.page : undefined;
  const result = await runAssistant(history, { ip: clientIp(request), page });
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
