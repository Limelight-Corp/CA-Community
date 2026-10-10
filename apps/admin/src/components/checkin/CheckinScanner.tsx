'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Keyboard, Loader2, RotateCcw, ScanLine, ShieldX, Undo2, UserCheck, XCircle } from 'lucide-react';
import { cn, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { Panel } from '../ui/Display';

type Status = 'checked_in' | 'already' | 'wrong_event' | 'not_confirmed' | 'cancelled' | 'not_found' | 'invalid';

interface Attendee {
  id: string;
  bookingId: string;
  name: string;
  eventTitle: string;
  city: string;
  organisation?: string;
  attendedAt?: string;
  certificateId?: string;
}
interface Result {
  status: Status;
  message: string;
  attendee?: Attendee;
  stats?: Stats;
}
interface Stats {
  confirmed: number;
  checkedIn: number;
  recent: Attendee[];
}
interface EventOption {
  id: string;
  title: string;
  date: string;
  city: string;
}

const LOOK: Record<Status, { tone: 'ok' | 'warn' | 'bad'; title: string; Icon: React.ComponentType<{ className?: string }> }> = {
  checked_in: { tone: 'ok', title: 'Checked in', Icon: CheckCircle2 },
  already: { tone: 'warn', title: 'Already checked in', Icon: UserCheck },
  wrong_event: { tone: 'warn', title: 'Different event', Icon: AlertTriangle },
  not_confirmed: { tone: 'bad', title: 'Not valid for entry', Icon: XCircle },
  cancelled: { tone: 'bad', title: 'Booking cancelled', Icon: XCircle },
  not_found: { tone: 'bad', title: 'Booking not found', Icon: ShieldX },
  invalid: { tone: 'bad', title: 'Invalid QR', Icon: ShieldX },
};

const time = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '';

function feedback(tone: 'ok' | 'warn' | 'bad') {
  try {
    navigator.vibrate?.(tone === 'ok' ? 80 : [60, 60, 60]);
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = tone === 'ok' ? 880 : tone === 'warn' ? 520 : 220;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
    osc.onended = () => void ctx.close();
  } catch {
    /* feedback is best-effort */
  }
}

export function CheckinScanner({ events, initialEventId }: { events: EventOption[]; initialEventId?: string }) {
  const { toast } = useToast();
  const [eventId, setEventId] = useState(initialEventId ?? '');
  const [stats, setStats] = useState<Stats | null>(null);
  const [camera, setCamera] = useState<'off' | 'starting' | 'on' | 'denied' | 'unsupported'>('off');
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState('');
  const [session, setSession] = useState<Attendee[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);
  const lastRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const eventRef = useRef(eventId);
  eventRef.current = eventId;

  const loadStats = useCallback(async (id: string) => {
    if (!id) return setStats(null);
    const res = await api<Stats>(`/api/checkin?eventId=${encodeURIComponent(id)}`);
    if (res.ok && res.data) setStats(res.data);
  }, []);

  useEffect(() => {
    void loadStats(eventId);
    const t = window.setInterval(() => void loadStats(eventId), 15_000);
    return () => window.clearInterval(t);
  }, [eventId, loadStats]);

  const submit = useCallback(
    async (body: { code?: string; bookingId?: string }) => {
      setBusy(true);
      pausedRef.current = true;
      const res = await api<Result>('/api/checkin', { method: 'POST', body: { ...body, eventId: eventRef.current || undefined } });
      setBusy(false);
      if (!res.ok || !res.data) {
        setResult({ status: 'invalid', message: res.error ?? 'Check-in failed. Try again.' });
        feedback('bad');
      } else {
        setResult(res.data);
        feedback(LOOK[res.data.status].tone);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.status === 'checked_in' && res.data.attendee) {
          const a = res.data.attendee;
          setSession((s) => [a, ...s.filter((x) => x.id !== a.id)].slice(0, 20));
        }
      }
      // Resume scanning shortly; the volunteer can also tap "Scan next".
      window.setTimeout(() => {
        pausedRef.current = false;
      }, 2200);
    },
    []
  );

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamera((c) => (c === 'on' || c === 'starting' ? 'off' : c));
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;
    if (!pausedRef.current && video.readyState >= 2 && video.videoWidth) {
      const scale = Math.min(1, 640 / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const hit = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
        if (hit?.data) {
          const now = Date.now();
          // Ignore the same QR for a few seconds so one ticket isn't submitted repeatedly.
          if (hit.data !== lastRef.current.code || now - lastRef.current.at > 4000) {
            lastRef.current = { code: hit.data, at: now };
            void submit({ code: hit.data });
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [submit]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unsupported');
      return;
    }
    setCamera('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setCamera('on');
      pausedRef.current = false;
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCamera('denied');
    }
  }, [tick]);

  useEffect(() => stopCamera, [stopCamera]);

  const undo = async (a: Attendee) => {
    const res = await api('/api/registrations', { method: 'PATCH', body: { id: a.id, action: 'set_attended', value: false } });
    if (!res.ok) return toast(res.error ?? 'Could not undo');
    toast(`${a.name} marked absent`);
    setSession((s) => s.filter((x) => x.id !== a.id));
    if (result?.attendee?.id === a.id) setResult(null);
    void loadStats(eventId);
  };

  const look = result ? LOOK[result.status] : null;
  const pct = stats && stats.confirmed ? Math.round((stats.checkedIn / stats.confirmed) * 100) : 0;
  const selected = events.find((e) => e.id === eventId);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        {/* Event + live count */}
        <Panel>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">Checking in for</span>
              <select
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setResult(null);
                }}
                className="h-11 rounded-xl border border-mist/[0.14] bg-bg/60 px-3 text-[14.5px] text-[var(--fg)] outline-none focus:border-gold/50"
              >
                <option value="">Any event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.date} · {e.title} · {e.city}
                  </option>
                ))}
              </select>
            </label>
            {stats && selected && (
              <div>
                <div className="flex items-end justify-between gap-3">
                  <p className="font-display text-[40px] font-semibold leading-none text-[var(--fg)] tabular-nums">
                    {stats.checkedIn}
                    <span className="text-[20px] text-[var(--muted)]"> / {stats.confirmed}</span>
                  </p>
                  <p className="pb-1 text-[13px] text-[var(--muted)]">checked in · {pct}%</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist/[0.1]">
                  <div className="h-full rounded-full bg-grad-gold transition-all duration-700" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Camera */}
        <Panel>
          <div className="relative overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} playsInline muted className={cn('aspect-[4/3] w-full object-cover', camera !== 'on' && 'hidden')} />
            <canvas ref={canvasRef} className="hidden" />
            {camera === 'on' && (
              <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="relative h-[62%] aspect-square rounded-3xl border-2 border-white/70 shadow-[0_0_0_100vmax_rgb(0_0_0/0.35)]">
                  <span className="absolute inset-x-4 top-1/2 h-0.5 animate-pulse bg-gold shadow-[0_0_14px_rgb(var(--gold-rgb))]" />
                </div>
              </div>
            )}
            {camera !== 'on' && (
              <div className="grid aspect-[4/3] w-full place-items-center p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  {camera === 'denied' || camera === 'unsupported' ? (
                    <CameraOff className="h-10 w-10 text-bad" aria-hidden />
                  ) : (
                    <ScanLine className="h-10 w-10 text-gold" aria-hidden />
                  )}
                  <p className="max-w-[34ch] text-[14px] text-white/80">
                    {camera === 'denied'
                      ? 'Camera access was blocked. Allow the camera in the browser settings, or type the booking ID below.'
                      : camera === 'unsupported'
                        ? 'This browser can’t open the camera here (it needs HTTPS). Type the booking ID below.'
                        : 'Start the camera and point it at the ticket QR.'}
                  </p>
                  {camera !== 'unsupported' && (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={camera === 'starting'}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-primary px-5 text-[14px] font-semibold text-white disabled:opacity-60"
                    >
                      {camera === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
                      {camera === 'denied' ? 'Try again' : 'Start camera'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {camera === 'on' && (
            <button type="button" onClick={stopCamera} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--fg)]">
              <CameraOff className="h-4 w-4" aria-hidden /> Stop camera
            </button>
          )}

          {/* Manual entry */}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (manual.trim()) void submit({ bookingId: manual.trim() });
            }}
          >
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Booking ID</span>
              <Keyboard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value.toUpperCase())}
                placeholder="Booking ID, e.g. ASC-GST-4QHKYU"
                className="h-11 w-full rounded-xl border border-mist/[0.14] bg-bg/60 pl-9 pr-3 font-mono text-[14px] text-[var(--fg)] outline-none placeholder:font-sans placeholder:text-faint focus:border-gold/50"
              />
            </label>
            <button type="submit" disabled={busy || !manual.trim()} className="h-11 shrink-0 rounded-xl bg-grad-primary px-4 text-[14px] font-semibold text-white disabled:opacity-50">
              Check in
            </button>
          </form>
        </Panel>
      </div>

      <div className="flex flex-col gap-6">
        {/* Result */}
        <div aria-live="assertive">
          {busy ? (
            <Panel>
              <p className="inline-flex items-center gap-2 text-[15px] text-[var(--muted)]">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Checking…
              </p>
            </Panel>
          ) : result && look ? (
            <div
              className={cn(
                'overflow-hidden rounded-[24px] border p-6',
                look.tone === 'ok' && 'border-ok/40 bg-ok/10',
                look.tone === 'warn' && 'border-warn/40 bg-warn/10',
                look.tone === 'bad' && 'border-bad/40 bg-bad/10'
              )}
            >
              <div className="flex items-start gap-4">
                <look.Icon className={cn('h-10 w-10 shrink-0', look.tone === 'ok' ? 'text-ok' : look.tone === 'warn' ? 'text-warn' : 'text-bad')} aria-hidden />
                <div className="min-w-0">
                  <p className="font-display text-[26px] font-semibold leading-tight text-[var(--fg)]">{look.title}</p>
                  {result.attendee && <p className="mt-1 truncate font-display text-[20px] text-[var(--fg)]">{result.attendee.name}</p>}
                  <p className="mt-1 text-[14px] text-[var(--fg-soft)]">
                    {result.status === 'already' && result.attendee?.attendedAt ? `First checked in at ${time(result.attendee.attendedAt)}.` : result.message}
                  </p>
                  {result.attendee && (
                    <p className="mt-2 font-mono text-[12px] text-[var(--muted)]">
                      {result.attendee.bookingId} · {result.attendee.eventTitle}
                      {result.attendee.organisation ? ` · ${result.attendee.organisation}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  pausedRef.current = false;
                }}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.2] px-4 text-[13.5px] font-semibold text-[var(--fg)] hover:border-mist/50"
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> Scan next
              </button>
            </div>
          ) : (
            <Panel>
              <p className="text-[14px] text-[var(--muted)]">Scan results appear here — green means let them in.</p>
            </Panel>
          )}
        </div>

        {/* This session */}
        <Panel title="Checked in on this device">
          {session.length === 0 ? (
            <p className="text-[13.5px] text-[var(--muted)]">Nobody yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-mist/[0.08]">
              {session.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-[var(--fg)]">{a.name}</span>
                    <span className="block font-mono text-[11.5px] text-[var(--muted)]">
                      {a.bookingId} · {time(a.attendedAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void undo(a)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] text-[var(--muted)] hover:bg-bad/10 hover:text-bad"
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {stats && stats.recent.length > 0 && (
          <Panel title="Latest arrivals (all devices)">
            <ul className="flex flex-col divide-y divide-mist/[0.08]">
              {stats.recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-[13.5px] text-[var(--fg)]">{a.name}</span>
                  <span className="shrink-0 font-mono text-[11.5px] text-[var(--muted)]">{time(a.attendedAt)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
