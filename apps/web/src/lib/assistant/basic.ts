/**
 * Quick-help mode: answers without an LLM (no ANTHROPIC_API_KEY, or the API is unavailable).
 * Understands greetings, event filters (free/paid, city, online/offline, month, type, name)
 * and the common support questions, and answers only from site content.
 */
import type { CommunityEvent, CommunitySpeaker } from '@ascend/shared';
import { MEMBERSHIP_PLANS, ORG_POSITIONING } from '@ascend/shared';
import { getItems, getSettings } from '../community-store';
import { isUpcoming } from '../events';
import { searchEvents, searchSite, SITE_PAGES, type EventCard, type EventQuery, type LinkCard } from './knowledge';
import type { AssistantReply, ChatTurn } from './agent';

const page = (href: string): LinkCard => {
  const p = SITE_PAGES.find((x) => x.href === href)!;
  return { title: p.title, href: p.href, description: p.description };
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const CITY_ALIASES: Record<string, string> = { bangalore: 'bengaluru', bombay: 'mumbai', gurgaon: 'gurugram', delhi: 'delhi', ncr: 'delhi' };
const CATEGORY_WORDS: [RegExp, string][] = [
  [/workshop/, 'Workshop'],
  [/seminar|clinic/, 'Seminar'],
  [/summit|conference|conclave/, 'Conference'],
  [/networking|meet ?up|mixer/, 'Networking'],
  [/training|masterclass|course/, 'Training'],
  [/career|job|placement/, 'Career'],
];

const reply = (r: Omit<AssistantReply, 'mode'>): AssistantReply => ({ ...r, mode: 'basic' });

export function basicReply(history: ChatTurn[]): AssistantReply {
  const raw = (history.at(-1)?.content ?? '').trim();
  const q = raw.toLowerCase().replace(/\s+/g, ' ');
  const settings = getSettings();

  // ---- Small talk
  if (/^(hi+|hii+|hello+|hey+|helo|namaste|namaskar|hola|good (morning|afternoon|evening)|yo|sup)\b[\s!.?]*$/.test(q) || /^(hi|hello|hey|namaste)\b/.test(q) && q.split(' ').length <= 3) {
    return reply({
      reply: 'Hello! 👋 I can show you upcoming events (free or paid, by city or month), explain registration and payment, share membership plans, or connect you with the team. What would you like to know?',
      events: [],
      links: [],
      suggestions: ['Show upcoming events', 'Which events are free?', 'Membership plans', 'Talk to the team'],
    });
  }
  if (/\b(thank|thanks|thx|ty|shukriya|dhanyavad|dhanyawad)\b/.test(q)) {
    return reply({ reply: 'You’re welcome! Anything else I can help with?', events: [], links: [], suggestions: ['Show upcoming events', 'Membership plans', 'Talk to the team'] });
  }
  if (/\b(bye|goodbye|see you)\b/.test(q)) {
    return reply({ reply: 'Bye! Come back any time. 👋', events: [], links: [], suggestions: [] });
  }

  // ---- How to register / pay
  if (/(how|kaise|steps?|process).*(register|book|pay|payment)|(register|book|payment|pay) (kaise|karna|process)|\bupi\b|razorpay|net ?banking|card payment/.test(q)) {
    return reply({
      reply:
        'Registering takes about two minutes:\n1. Open the event and tap **Register Now**.\n2. Fill in your details — no login needed for this step.\n3. Paid events open a secure payment page: log in with your mobile OTP and pay by **UPI** (QR or any UPI app), card or net banking via Razorpay.\n4. Your booking is confirmed on screen with a booking ID.\nFree events are confirmed right after step 2.',
      events: [],
      links: [page('/events'), page('/legal/payment')],
      suggestions: ['Show upcoming events', 'Which events are free?', 'Refund policy'],
    });
  }

  // ---- Refunds / cancellation
  if (/refund|cancel|money back|paisa wapas/.test(q)) {
    return reply({
      reply: 'Cancellations and refunds follow the policy linked below. For a specific booking, request a follow-up with your booking ID and the team will help.',
      events: [],
      links: [page('/legal/refund'), page('/contact')],
      suggestions: ['Talk to the team', 'How do I pay?'],
    });
  }

  // ---- Membership
  if (/member|membership|join|plan|subscription|sadasya/.test(q) && !/event/.test(q)) {
    const plans = MEMBERSHIP_PLANS.map((p) => `• **${p.name}** (${p.audience}) — ₹${p.price.toLocaleString('en-IN')} / ${p.period}${p.priceNote ? ` ${p.priceNote}` : ''}`).join('\n');
    return reply({
      reply: `Membership plans (proposed — subject to confirmation):\n${plans}\nCompare benefits and apply on the Join Us page.`,
      events: [],
      links: [page('/join')],
      suggestions: ['What do members get?', 'Show upcoming events', 'Talk to the team'],
    });
  }

  // ---- Contact details
  if (/contact|phone|number|email|mail|address|office|call|whatsapp/.test(q) && !/talk to|follow/.test(q)) {
    const c = settings.contact;
    const lines = [c.email && `Email: **${c.email}**`, c.phone && `Phone: **${c.phone}**`, c.address && `Address: ${c.address}`].filter(Boolean).join('\n');
    const askedPhone = /phone|number|call|whatsapp/.test(q);
    const note = askedPhone && !c.phone ? 'A phone number isn’t published yet — email is the quickest way, or tap Talk to the team for a call back.\n' : '';
    return reply({
      reply: lines ? `${note}You can reach the team here:\n${lines}` : 'Contact details are on the Contact page.',
      events: [],
      links: [page('/contact')],
      suggestions: ['Talk to the team', 'Show upcoming events'],
    });
  }

  // ---- Launch / about
  if (/launch|when.*(start|begin)|kab.*(start|shuru)/.test(q)) {
    return reply({ reply: `ASCEND launches on **${ORG_POSITIONING.launchLabel}**. Founding member registrations are open now.`, events: [], links: [page('/join'), page('/about')], suggestions: ['Membership plans', 'Show upcoming events'] });
  }
  if (/what is ascend|about ascend|who are you|ascend kya|about (us|the community)|vision|mission/.test(q)) {
    return reply({ reply: `${ORG_POSITIONING.idea} ${ORG_POSITIONING.pillarsLine}`, events: [], links: [page('/about'), page('/wings')], suggestions: ['Membership plans', 'Show upcoming events'] });
  }

  // ---- Login / account
  if (/login|log in|sign in|otp|password|account|dashboard/.test(q)) {
    return reply({ reply: 'Members log in with a one-time code sent to their mobile number (or email and password). You only need to log in to pay for a paid event or to use your dashboard.', events: [], links: [page('/login')], suggestions: ['How do I pay?', 'Talk to the team'] });
  }

  // ---- Speakers
  if (/speaker|faculty|expert/.test(q)) {
    const speakers = getItems<CommunitySpeaker>('speakers', true);
    const topic = searchSite(raw).filter((l) => l.href.startsWith('/speakers/'));
    const list = (topic.length ? topic : speakers.map((s) => ({ title: s.name, href: `/speakers/${s.slug}`, description: s.title }))).slice(0, 6);
    return reply({ reply: topic.length ? 'These speakers match:' : 'Here are our speakers:', events: [], links: list, suggestions: ['Show upcoming events', 'Talk to the team'] });
  }

  // ---- Events
  const events = getItems<CommunityEvent>('events', true);
  const cities = Array.from(new Set(events.map((e) => e.city?.trim()).filter((c): c is string => !!c && c.toLowerCase() !== 'online')));
  const eventWords = /event|workshop|seminar|summit|conference|webinar|masterclass|networking|training|clinic|meet ?up|session|register|ticket|\bfree\b|\bpaid\b|upcoming|happening|karyakram|career/;
  const cityHit =
    cities.find((c) => q.includes(c.toLowerCase())) ??
    (() => {
      const alias = Object.entries(CITY_ALIASES).find(([k]) => new RegExp(`\\b${k}\\b`).test(q));
      return alias ? cities.find((c) => c.toLowerCase().includes(alias[1])) ?? alias[1] : undefined;
    })();
  const monthIdx = MONTHS.findIndex((m) => new RegExp(`\\b${m}[a-z]*\\b`).test(q));
  // An event is named when the question has a word that appears in only that event's title (e.g. "GST"),
  // or two of its words. Skipped for resource questions ("budget pdf").
  const titleWords = (t: string) =>
    t.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !/^(the|and|for|with|event|events|ascend)$/.test(w));
  const freq = new Map<string, number>();
  for (const e of events) for (const w of new Set(titleWords(e.title))) freq.set(w, (freq.get(w) ?? 0) + 1);
  const qWords = new Set(q.split(/[^a-z0-9]+/));
  const titleHit = /resource|pdf|guide|download|news/.test(q)
    ? undefined
    : events.find((e) => {
        const hits = titleWords(e.title).filter((w) => qWords.has(w));
        return hits.length >= 2 || hits.some((w) => freq.get(w) === 1 && !/^(young|modern|inside|office|summit|clinic|launch)$/.test(w));
      });

  if (eventWords.test(q) || cityHit || monthIdx >= 0 || /this month|next month|is mahine|agle mahine/.test(q) || titleHit) {
    if (titleHit && !/\b(free|paid|online|offline)\b/.test(q)) {
      const one = searchEvents({ query: titleHit.title, includePast: true, limit: 1 });
      return reply({ reply: isUpcoming(titleHit) ? 'Here are the details:' : 'This event has already taken place:', events: one, links: [], suggestions: ['How do I pay?', 'Show upcoming events', 'Talk to the team'] });
    }

    const filter: EventQuery = { limit: 6 };
    const adj: string[] = []; // before the noun: free / paid / online / in-person
    const where: string[] = []; // after the noun: in Mumbai / in February 2027
    let noun = 'event';
    if (/\bfree\b|muft|no fee|without (any )?fee|bina fee/.test(q)) {
      filter.maxFee = 0;
      adj.push('free');
    } else if (/\bpaid\b/.test(q)) {
      filter.paid = true;
      adj.push('paid');
    }
    if (/\bonline\b|virtual|webinar|zoom/.test(q)) {
      filter.mode = 'Online';
      adj.push('online');
    } else if (/offline|in[- ]person|physical|venue/.test(q)) {
      filter.mode = 'Offline';
      adj.push('in-person');
    }
    const cat = CATEGORY_WORDS.find(([re]) => re.test(q));
    if (cat) {
      filter.category = cat[1];
      noun = cat[1] === 'Networking' ? 'networking event' : cat[1] === 'Career' ? 'career event' : cat[1].toLowerCase();
    }
    if (cityHit) {
      filter.city = cityHit;
      where.push(`in ${cityHit.replace(/\b\w/g, (c) => c.toUpperCase())}`);
    }
    const today = new Date();
    if (/this month|is mahine/.test(q)) filter.month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    else if (/next month|agle mahine/.test(q)) {
      const n = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      filter.month = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    } else if (monthIdx >= 0) {
      const mm = String(monthIdx + 1).padStart(2, '0');
      const yearHit = q.match(/\b(20\d{2})\b/)?.[1];
      const upcomingInMonth = events.filter((e) => isUpcoming(e) && e.date.slice(5, 7) === mm).map((e) => e.date.slice(0, 4)).sort()[0];
      filter.month = `${yearHit ?? upcomingInMonth ?? today.getFullYear()}-${mm}`;
    }
    if (filter.month) where.push(`in ${new Date(`${filter.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`);
    if (/\bpast\b|previous|completed|pichl/.test(q)) filter.pastOnly = true;

    const found: EventCard[] = searchEvents(filter);
    const when = filter.pastOnly ? 'past' : 'upcoming';
    const phrase = (n: number) => [when, ...adj, n === 1 ? noun : `${noun}s`, ...where].join(' ');
    if (!found.length) {
      return reply({
        reply: `There are no ${phrase(2)} right now. New events are added regularly — I can show you everything that’s coming up.`,
        events: [],
        links: [page('/events')],
        suggestions: ['Show upcoming events', 'Talk to the team'],
      });
    }
    return reply({
      reply: found.length === 1 ? `Here’s the ${phrase(1)}:` : `Here are the ${found.length} ${phrase(found.length)}:`,
      events: found,
      links: found.length >= 6 ? [page('/events')] : [],
      suggestions: filter.maxFee === 0 ? ['Show paid events', 'How do I register?', 'Talk to the team'] : ['Which events are free?', 'How do I pay?', 'Talk to the team'],
    });
  }

  // ---- Talk to a human
  if (/talk|human|person|team|help|support|follow|callback|call back|baat|sampark/.test(q)) {
    return reply({ reply: 'Happy to connect you with the team — tap **Talk to the team** below and leave your details; they’ll get back to you.', events: [], links: [page('/contact')], suggestions: ['Talk to the team'] });
  }

  // ---- Anything else: site search
  const links = searchSite(raw);
  if (links.length) return reply({ reply: 'These look relevant:', events: [], links, suggestions: ['Show upcoming events', 'Talk to the team'] });
  return reply({
    reply: 'Sorry, I didn’t quite get that. I can help with events, registration and payment, membership plans, resources or contacting the team — try one of these:',
    events: [],
    links: [],
    suggestions: ['Show upcoming events', 'Which events are free?', 'Membership plans', 'Talk to the team'],
  });
}
