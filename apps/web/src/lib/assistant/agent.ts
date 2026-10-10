/**
 * Support assistant (server-only): Claude with three tools —
 *   search_events  → live event search (cards with register links)
 *   search_site    → pages / resources / news / speakers / wings with direct links
 *   create_lead    → saves a follow-up request to the admin Messages inbox (same as /api/contact)
 *
 * Without ANTHROPIC_API_KEY (or if the API is unreachable) it answers in a basic, rule-based mode
 * from the same search helpers, so the widget never breaks.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod/v4';
import { contactMessageSchema } from '../form-schemas';
import { saveContactMessage } from '../leads';
import { rateLimit } from '../form-guard';
import { searchEvents, searchSite, siteFacts, type EventCard, type LinkCard } from './knowledge';
import { basicReply } from './basic';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantReply {
  reply: string;
  events: EventCard[];
  links: LinkCard[];
  lead?: { id: string };
  /** Suggested follow-up prompts for the chips under the answer. */
  suggestions: string[];
  mode: 'ai' | 'basic';
}

const MODEL = 'claude-opus-5-5';

const SYSTEM_PROMPT = `You are the support assistant on the ASCEND website — a professional community for Chartered Accountants, allied professionals and CA students.

How to help:
- Answer briefly and warmly (2–5 short sentences). Match the visitor's language: reply in Hindi, English or Hinglish as they write.
- Use search_events for anything about events, dates, cities, fees, seats or registering. Use search_site to find the right page, resource, news item, speaker or wing. The website shows the returned cards and links under your answer, so refer to them instead of pasting URLs.
- Only state facts that come from the tools or the facts below. If something isn't covered (exact dates not announced, policies, custom requests), say so and offer a follow-up from the team.
- Follow-up / callback / "talk to someone": collect the visitor's name, email and a short description of what they need (phone is optional). Repeat the details back and ask for a clear yes before calling create_lead. Never invent contact details. After saving, tell them the team will get back to them.
- Payments, membership approval and refunds are handled by the team or on the site's own pages — never promise outcomes, discounts or timelines.
- Never ask for card numbers, UPI PINs, OTPs or passwords.

Site facts:
${'{{FACTS}}'}`;

function systemPrompt(): string {
  return SYSTEM_PROMPT.replace('{{FACTS}}', siteFacts());
}

/* ------------------------------------------------------------------------------------------ */

export async function runAssistant(history: ChatTurn[], ctx: { ip: string; page?: string }): Promise<AssistantReply> {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return basicReply(history);
  try {
    return await aiReply(history, ctx);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) console.error('[assistant] rate limited');
    else if (error instanceof Anthropic.AuthenticationError) console.error('[assistant] invalid ANTHROPIC_API_KEY');
    else if (error instanceof Anthropic.APIError) console.error(`[assistant] API error ${error.status}:`, error.message);
    else console.error('[assistant] error:', error);
    return basicReply(history);
  }
}

async function aiReply(history: ChatTurn[], ctx: { ip: string; page?: string }): Promise<AssistantReply> {
  const client = new Anthropic();
  const collected: Pick<AssistantReply, 'events' | 'links' | 'lead'> = { events: [], links: [] };

  const tools = [
    betaZodTool({
      name: 'search_events',
      description:
        'Search ASCEND events. Returns upcoming events (title, date, time, location, mode, fee, seats left, links). All filters are optional; call with no filters to list what is coming up.',
      inputSchema: z.object({
        query: z.string().optional().describe('Keywords: topic, event name, speaker, category'),
        city: z.string().optional(),
        mode: z.enum(['Online', 'Offline']).optional(),
        max_fee: z.number().optional().describe('Maximum fee in INR; 0 for free events'),
        paid_only: z.boolean().optional().describe('true for paid events only'),
        category: z.enum(['Networking', 'Seminar', 'Workshop', 'Conference', 'Training', 'Career', 'Social']).optional(),
        month: z.string().optional().describe('YYYY-MM'),
        include_past: z.boolean().optional(),
      }),
      run: (input) => {
        const cards = searchEvents({
          query: input.query,
          city: input.city,
          mode: input.mode,
          maxFee: input.max_fee,
          paid: input.paid_only,
          category: input.category,
          month: input.month,
          includePast: input.include_past,
        });
        for (const c of cards) if (!collected.events.some((e) => e.href === c.href)) collected.events.push(c);
        return JSON.stringify(cards.length ? cards : { result: 'No matching events.' });
      },
    }),
    betaZodTool({
      name: 'search_site',
      description:
        'Search the ASCEND website (pages, membership, contact, policies, resources, news, speakers, wings). Returns titles, short descriptions and direct links.',
      inputSchema: z.object({ query: z.string().describe('What the visitor is looking for') }),
      run: ({ query }) => {
        const cards = searchSite(query);
        for (const c of cards) if (!collected.links.some((l) => l.href === c.href && l.title === c.title)) collected.links.push(c);
        return JSON.stringify(cards.length ? cards : { result: 'Nothing matched. Suggest the Contact page or a follow-up.' });
      },
    }),
    betaZodTool({
      name: 'create_lead',
      description:
        "Save a follow-up request so the ASCEND team contacts the visitor. Only call after the visitor has given their name, email and request AND explicitly confirmed they want to be contacted.",
      inputSchema: z.object({
        name: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        topic: z.string().describe('Short subject, e.g. "Membership query" or "Event: GST Clinic"'),
        message: z.string().describe("The visitor's request in their own words, plus useful context from the chat"),
        visitor_confirmed: z.boolean().describe('true only if the visitor explicitly said yes to being contacted'),
      }),
      run: (input) => {
        if (!input.visitor_confirmed) return 'Not saved: ask the visitor to confirm first.';
        if (collected.lead) return 'Already saved in this reply.';
        if (!rateLimit(`lead:${ctx.ip}`, 3, 10 * 60_000)) return 'Not saved: too many requests from this connection. Suggest the Contact page.';
        const parsed = contactMessageSchema.safeParse({
          name: input.name,
          email: input.email,
          phone: input.phone,
          subject: `Chat follow-up: ${input.topic}`.slice(0, 160),
          message: `${input.message}\n\n— Sent from the website chat assistant${ctx.page ? ` (page: ${ctx.page})` : ''}.`,
        });
        if (!parsed.success) {
          return `Not saved: ${parsed.error.issues.map((i) => `${String(i.path[0])}: ${i.message}`).join('; ')}. Ask the visitor to correct this.`;
        }
        const saved = saveContactMessage(parsed.data);
        collected.lead = { id: saved.id };
        return 'Saved. The team will follow up by email or phone.';
      },
    }),
  ];

  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((t) => ({ role: t.role, content: t.content }));
  if (ctx.page) messages.push({ role: 'system', content: `The visitor is currently on this page: ${ctx.page}` });

  const final = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    cache_control: { type: 'ephemeral' },
    system: systemPrompt(),
    tools,
    messages,
    max_iterations: 6,
  });

  let reply = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (final.stop_reason === 'refusal' || !reply) {
    reply = 'Sorry, I can’t help with that here. You can reach the team from the Contact page, or ask me for a follow-up.';
  }

  return { reply, ...collected, suggestions: suggestionsFor(history.at(-1)?.content ?? '', collected), mode: 'ai' };
}

const has = (text: string, ...keys: string[]) => keys.some((k) => text.includes(k));

function suggestionsFor(lastUser: string, got: { events: EventCard[]; links: LinkCard[] }): string[] {
  const q = lastUser.toLowerCase();
  if (got.events.length) return ['Which events are free?', 'How do I pay for an event?', 'Talk to the team'];
  if (has(q, 'member', 'join', 'plan')) return ['Show upcoming events', 'What do members get?', 'Talk to the team'];
  return ['Show upcoming events', 'Membership plans', 'Talk to the team'];
}
