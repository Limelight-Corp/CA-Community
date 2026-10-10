'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CreditCard,
  Headphones,
  Loader2,
  MapPin,
  MessageCircle,
  Send,
  Sparkles,
  Ticket,
  UserPlus,
  X,
} from 'lucide-react';
import { cn } from '@ascend/ui';

/* Mirrors the /api/assistant response (see src/lib/assistant). */
interface EventCard {
  title: string;
  href: string;
  registerHref?: string;
  date: string;
  time: string;
  location: string;
  mode: string;
  fee: string;
  seatsLeft: number;
  status: 'open' | 'closed';
}
interface LinkCard {
  title: string;
  href: string;
  description?: string;
}
interface Msg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  events?: EventCard[];
  links?: LinkCard[];
  suggestions?: string[];
  lead?: boolean;
  mode?: 'ai' | 'basic';
}

const STORE_KEY = 'ascend:assistant:v1';

const QUICK_ACTIONS = [
  { label: 'Upcoming events', prompt: 'Show me the upcoming events', icon: CalendarDays },
  { label: 'Register & pay', prompt: 'How do I register and pay for an event?', icon: CreditCard },
  { label: 'Membership plans', prompt: 'What membership plans are there?', icon: UserPlus },
  { label: 'Resources', prompt: 'Where can I find resources and guides?', icon: BookOpen },
] as const;

const uid = () => Math.random().toString(36).slice(2, 10);

/** Tiny formatter: paragraphs, line breaks and **bold** — no HTML from the model is ever injected. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className={i ? 'mt-2' : undefined}>
          {para.split('\n').map((line, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {line.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
                part.startsWith('**') && part.endsWith('**') ? (
                  <strong key={k} className="font-semibold text-[var(--fg)]">
                    {part.slice(2, -2)}
                  </strong>
                ) : (
                  <React.Fragment key={k}>{part}</React.Fragment>
                )
              )}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  );
}

export function SupportChat() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showLead, setShowLead] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  // Restore this tab's conversation.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, showLead]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setError('');
    setInput('');
    setShowLead(false);
    const next: Msg[] = [...messages, { id: uid(), role: 'user', content }];
    setMessages(next);
    setBusy(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-16).map(({ role, content: c }) => ({ role, content: c })), page: pathname }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          content: data.reply,
          events: data.events,
          links: data.links,
          suggestions: data.suggestions,
          lead: !!data.lead,
          mode: data.mode,
        },
      ]);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setShowLead(false);
    setError('');
  };

  const onEventPage = /^\/events\/[^/]+$/.test(pathname);
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <>
      {/* Launcher */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="support-chat"
        aria-label={open ? 'Close chat' : 'Chat with ASCEND Assistant'}
        className={cn(
          'ring-spin fixed right-4 z-[60] grid h-14 w-14 place-items-center rounded-full bg-grad-primary text-white shadow-[0_18px_40px_-12px_rgb(var(--lime-rgb)/0.9)] transition-transform duration-300 hover:scale-105 print:hidden sm:right-6',
          onEventPage ? 'bottom-[92px] lg:bottom-6' : 'bottom-5 sm:bottom-6'
        )}
      >
        <span className="grid h-full w-full place-items-center rounded-full bg-grad-primary">
          {open ? <X className="h-6 w-6" aria-hidden /> : <MessageCircle className="h-6 w-6" aria-hidden />}
        </span>
        {!open && messages.length === 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-gold text-brand-950" aria-hidden>
            <Sparkles className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Panel */}
      <section
        id="support-chat"
        role="dialog"
        aria-label="ASCEND Assistant"
        aria-hidden={!open}
        className={cn(
          'glass-panel fixed z-[60] flex flex-col overflow-hidden rounded-[26px] shadow-[0_40px_100px_-30px_rgb(var(--black-rgb)/0.95)] transition-all duration-300 print:hidden',
          'inset-x-3 bottom-[88px] top-[max(12px,env(safe-area-inset-top))] sm:inset-x-auto sm:right-6 sm:top-auto sm:h-[min(640px,calc(100svh-120px))] sm:w-[400px]',
          onEventPage && 'bottom-[164px] lg:bottom-[92px]',
          !onEventPage && 'sm:bottom-[92px]',
          open ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-4 opacity-0'
        )}
        style={{ background: 'linear-gradient(180deg, rgb(var(--panel-rgb) / 0.96), rgb(var(--bg-rgb) / 0.97))' }}
      >
        {/* Header */}
        <header className="relative flex items-center gap-3 border-b border-mist/[0.1] px-4 py-3.5">
          <span className="halo grid h-10 w-10 shrink-0 place-items-center rounded-full bg-grad-primary text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display text-[16px] font-semibold text-[var(--fg)]">ASCEND Assistant</p>
            <p className="flex items-center gap-1.5 text-[12px] text-[var(--muted)]">
              <span className="live-dot" aria-hidden />{' '}
              {lastAssistant?.mode === 'basic' ? 'Quick-help mode' : 'Events, membership & help'}
            </p>
          </div>
          {messages.length > 0 && (
            <button type="button" onClick={reset} className="rounded-full px-2.5 py-1 text-[12px] text-[var(--muted)] hover:bg-mist/[0.08] hover:text-[var(--fg)]">
              New chat
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--muted)] hover:bg-mist/[0.08] hover:text-[var(--fg)]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        {/* Conversation */}
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl rounded-tl-md border border-mist/[0.1] bg-mist/[0.04] px-4 py-3 text-[14px] leading-relaxed text-[var(--fg-soft)]">
                <p className="font-semibold text-[var(--fg)]">Namaste! 👋</p>
                <p className="mt-1">
                  I can find events, explain registration and payment, point you to the right page, or get the team to call you
                  back. Ask in English, Hindi or Hinglish.
                </p>
              </div>
              <div>
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--muted)]">Quick actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(({ label, prompt, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => send(prompt)}
                      className="group flex items-center gap-2 rounded-2xl border border-mist/[0.12] bg-bg/40 px-3 py-2.5 text-left text-[13px] font-medium text-[var(--fg)] transition hover:border-gold/40 hover:bg-gold/[0.06]"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:scale-110" aria-hidden />
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowLead(true)}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-gold/30 bg-gold/[0.07] px-3 py-2.5 text-[13px] font-semibold text-gold-soft transition hover:bg-gold/[0.12]"
                  >
                    <Headphones className="h-4 w-4" aria-hidden /> Talk to the team — request a follow-up
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-grad-primary px-4 py-2.5 text-[14px] leading-relaxed text-white">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex flex-col gap-2.5">
                <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-mist/[0.1] bg-mist/[0.04] px-4 py-3 text-[14px] leading-relaxed text-[var(--fg-soft)]">
                  <Rich text={m.content} />
                  {m.lead && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-ok/30 bg-ok/10 px-2.5 py-1 text-[12px] text-ok">
                      <Check className="h-3.5 w-3.5" aria-hidden /> Request sent to the team
                    </p>
                  )}
                </div>

                {m.events && m.events.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {m.events.map((e) => (
                      <li key={e.href} className="rounded-2xl border border-mist/[0.12] bg-bg/50 p-3">
                        <Link href={e.href} onClick={() => setOpen(false)} className="font-display text-[15px] font-medium leading-snug text-[var(--fg)] hover:text-gold-soft">
                          {e.title}
                        </Link>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {e.date} · {e.time}
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /> <span className="truncate">{e.location}</span>
                          </span>
                        </p>
                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="font-display text-[16px] font-semibold text-[var(--fg)]">{e.fee}</span>
                          {e.registerHref ? (
                            <Link
                              href={e.registerHref}
                              onClick={() => setOpen(false)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-grad-primary px-3 text-[12px] font-semibold text-white"
                            >
                              <Ticket className="h-3.5 w-3.5" aria-hidden /> Register
                            </Link>
                          ) : (
                            <span className="text-[12px] text-[var(--muted)]">Registration closed</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {m.links && m.links.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {m.links.map((l) => (
                      <li key={l.href + l.title}>
                        <Link
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-3 rounded-2xl border border-mist/[0.1] px-3 py-2 transition hover:border-brand-300/50 hover:bg-brand-500/10"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-[var(--fg)]">{l.title}</span>
                            {l.description && <span className="block truncate text-[11.5px] text-[var(--muted)]">{l.description}</span>}
                          </span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-200 transition-transform group-hover:rotate-45" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          )}

          {busy && (
            <div className="flex items-center gap-2 text-[13px] text-[var(--muted)]">
              <span className="flex gap-1" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
              Thinking…
            </div>
          )}

          {error && <p className="rounded-2xl border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad">{error}</p>}

          {showLead && <LeadForm page={pathname} onDone={(name) => {
            setShowLead(false);
            setMessages((m) => [...m, { id: uid(), role: 'assistant', content: `Thanks${name ? `, ${name}` : ''}! Your request is with the team — they’ll get back to you by email or phone.`, lead: true }]);
          }} onCancel={() => setShowLead(false)} />}

          {!busy && !showLead && lastAssistant?.suggestions && lastAssistant.suggestions.length > 0 && messages.at(-1)?.role === 'assistant' && (
            <div className="flex flex-wrap gap-1.5">
              {lastAssistant.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => (/talk to the team/i.test(s) ? setShowLead(true) : send(s))}
                  className="rounded-full border border-mist/[0.14] px-3 py-1.5 text-[12.5px] text-[var(--fg-soft)] transition hover:border-gold/50 hover:text-gold-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="border-t border-mist/[0.1] p-3"
        >
          <div className="flex items-center gap-2 rounded-full border border-mist/[0.14] bg-bg/60 py-1.5 pl-4 pr-1.5 focus-within:border-gold/50">
            <label htmlFor="support-chat-input" className="sr-only">
              Message
            </label>
            <input
              ref={inputRef}
              id="support-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={2000}
              placeholder="Ask about events, membership…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grad-primary text-white transition disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          <p className="mt-2 px-2 text-center text-[10.5px] text-faint">
            AI assistant — can make mistakes. Never share OTPs, UPI PINs or card details.
          </p>
        </form>
      </section>
    </>
  );
}

/** Follow-up request → POST /api/contact → admin Messages inbox. */
function LeadForm({ page, onDone, onCancel }: { page: string; onDone: (name: string) => void; onCancel: () => void }) {
  const [v, setV] = useState({ name: '', email: '', phone: '', message: '' });
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setFormError('Please tick the box so the team can contact you.');
      return;
    }
    setBusy(true);
    setFormError('');
    setErr({});
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: v.name,
          email: v.email,
          phone: v.phone || undefined,
          subject: 'Chat follow-up request',
          message: `${v.message}\n\n— Sent from the website chat assistant (page: ${page}).`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.fieldErrors || {});
        setFormError(data.error || 'Could not send. Please try again.');
        return;
      }
      onDone(v.name.split(' ')[0] ?? '');
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-xl border border-mist/[0.14] bg-bg/60 px-3 py-2 text-[13.5px] text-[var(--fg)] outline-none placeholder:text-faint focus:border-gold/50';
  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5 rounded-2xl border border-gold/30 bg-gold/[0.05] p-3.5" noValidate>
      <p className="flex items-center gap-2 text-[13.5px] font-semibold text-[var(--fg)]">
        <Headphones className="h-4 w-4 text-gold" aria-hidden /> Request a follow-up
      </p>
      <input aria-label="Your name" required placeholder="Your name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={field} />
      {err.name && <span className="text-[11.5px] text-bad">{err.name}</span>}
      <input aria-label="Email" type="email" required placeholder="Email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className={field} />
      {err.email && <span className="text-[11.5px] text-bad">{err.email}</span>}
      <input aria-label="Phone (optional)" type="tel" placeholder="Phone (optional)" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} className={field} />
      {err.phone && <span className="text-[11.5px] text-bad">{err.phone}</span>}
      <textarea
        aria-label="How can we help?"
        required
        rows={3}
        placeholder="How can we help?"
        value={v.message}
        onChange={(e) => setV({ ...v, message: e.target.value })}
        className={cn(field, 'resize-none')}
      />
      {err.message && <span className="text-[11.5px] text-bad">{err.message}</span>}
      <label className="flex items-start gap-2 text-[12px] leading-snug text-[var(--muted)]">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand-500)]" />
        I agree to be contacted by the ASCEND team about this request.
      </label>
      {formError && <span className="text-[12px] text-bad">{formError}</span>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-grad-gold text-[13px] font-semibold text-brand-950 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />} Send request
        </button>
        <button type="button" onClick={onCancel} className="h-9 rounded-full px-3 text-[13px] text-[var(--muted)] hover:text-[var(--fg)]">
          Cancel
        </button>
      </div>
    </form>
  );
}
