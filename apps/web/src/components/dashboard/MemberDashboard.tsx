'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, useToast } from '@ascend/ui';
import {
  AlertTriangle,
  Award,
  BookOpen,
  Camera,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  KeyRound,
  LayoutGrid,
  Loader2,
  Lock,
  MailWarning,
  MapPin,
  Receipt,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react';
import type { DashboardBooking, DashboardData } from '../../lib/member-dashboard';
import { getInitials, useAuth } from '../../context/AuthContext';
import { payWithRazorpay, type PaymentInit } from '../events/razorpay-client';

type Tab = 'overview' | 'events' | 'receipts' | 'certificates' | 'resources' | 'profile';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'events', label: 'My events', icon: Ticket },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'resources', label: 'Member resources', icon: BookOpen },
  { id: 'profile', label: 'Profile & security', icon: UserRound },
];

const inr = (n: number) => (n > 0 ? `₹${n.toLocaleString('en-IN')}` : 'Free');
const panel = 'rounded-[28px] border border-mist/[0.1] bg-grad-surface p-6 sm:p-7';
const pillBtn =
  'inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.16] px-4 text-[13.5px] font-semibold text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10';

export function MemberDashboard({ data, initialTab }: { data: DashboardData; initialTab?: string }) {
  const start = (TABS.some((t) => t.id === initialTab) ? initialTab : 'overview') as Tab;
  const [tab, setTab] = useState<Tab>(start);
  const { account, membership, isMember, bookings } = data;
  const upcoming = bookings.filter((b) => b.upcoming && b.status !== 'cancelled');
  const receipts = bookings.filter((b) => b.receiptUrl);
  const certificates = bookings.filter((b) => b.certificate);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-24 pt-10 md:px-8 md:pt-14">
      <Header data={data} />

      {!account.emailVerified && <VerifyBanner email={account.email} mailEnabled={data.mailEnabled} />}

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Dashboard" className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:px-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2.5 text-left text-[14px] font-medium transition lg:rounded-2xl',
                tab === id ? 'bg-mist/[0.1] text-[var(--fg)] ring-1 ring-mist/[0.14]' : 'text-[var(--muted)] hover:bg-mist/[0.05] hover:text-[var(--fg)]'
              )}
            >
              <Icon className={cn('h-4 w-4', tab === id && 'text-gold')} aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className="min-w-0">
          {tab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Upcoming events', value: upcoming.length, icon: CalendarDays },
                  { label: 'Bookings', value: bookings.length, icon: Ticket },
                  { label: 'Receipts', value: receipts.length, icon: Receipt },
                  { label: 'Certificates', value: certificates.length, icon: Award },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-[22px] border border-mist/[0.1] bg-grad-surface p-5">
                    <Icon className="h-5 w-5 text-gold" aria-hidden />
                    <p className="mt-4 font-display text-[34px] font-medium leading-none tracking-[-0.04em] text-[var(--fg)]">{value}</p>
                    <p className="mt-1.5 text-[12.5px] text-[var(--muted)]">{label}</p>
                  </div>
                ))}
              </div>
              <MembershipCard
                membership={membership}
                isMember={isMember}
                verified={account.emailVerified}
                siteName={data.siteName}
                prefill={{ name: account.name, email: account.email, contact: account.mobile }}
              />
              <section className={panel}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Next up</h2>
                  {upcoming.length > 1 && (
                    <button type="button" onClick={() => setTab('events')} className="text-[13px] font-semibold text-brand-200 hover:text-white">
                      All events →
                    </button>
                  )}
                </div>
                {upcoming[0] ? (
                  <div className="mt-5">
                    <BookingCard b={upcoming[0]} />
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    text={account.emailVerified ? 'No upcoming bookings yet.' : 'Confirm your email to see bookings made with it.'}
                    action={{ href: '/events', label: 'Explore events' }}
                  />
                )}
              </section>
            </div>
          )}

          {tab === 'events' && (
            <div className="flex flex-col gap-8">
              <BookingList title="Upcoming" items={bookings.filter((b) => b.upcoming)} verified={account.emailVerified} />
              <BookingList title="Past" items={bookings.filter((b) => !b.upcoming)} verified={account.emailVerified} past />
            </div>
          )}

          {tab === 'receipts' && (
            <section className={panel}>
              <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Receipts</h2>
              <p className="mt-1 text-[13.5px] text-[var(--muted)]">Payment receipts for paid bookings and confirmations for free ones.</p>
              {receipts.length ? (
                <ul className="mt-5 divide-y divide-mist/[0.08]">
                  {receipts.map((b) => (
                    <li key={b.bookingId} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-200">
                        <FileText className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-[var(--fg)]">{b.eventTitle}</span>
                        <span className="block font-mono text-[12px] text-[var(--muted)]">
                          {b.bookingId} · {b.paymentStatus === 'refunded' ? 'Refunded' : b.fee > 0 ? 'Paid' : 'Free'}
                        </span>
                      </span>
                      <span className="font-mono text-[14px] text-[var(--fg)]">{inr(b.fee)}</span>
                      <a href={b.receiptUrl} className={pillBtn}>
                        <Download className="h-4 w-4" aria-hidden /> PDF
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Receipt} text={account.emailVerified ? 'No receipts yet.' : 'Confirm your email to see your receipts.'} />
              )}
            </section>
          )}

          {tab === 'certificates' && (
            <section className={panel}>
              <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Certificates</h2>
              <p className="mt-1 text-[13.5px] text-[var(--muted)]">Issued when you are checked in at an event. Each one has a QR code anyone can verify.</p>
              {certificates.length ? (
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {certificates.map((b) => (
                    <li key={b.bookingId} className="holo relative overflow-hidden rounded-[22px] border border-gold/30 bg-gold/[0.05] p-5">
                      <Award className="h-6 w-6 text-gold" aria-hidden />
                      <p className="mt-3 font-display text-[18px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)]">{b.eventTitle}</p>
                      <p className="mt-1 font-mono text-[12px] text-[var(--muted)]">{b.certificate!.id}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a href={b.certificate!.pdfUrl} className={pillBtn}>
                          <Download className="h-4 w-4" aria-hidden /> Download
                        </a>
                        <a href={b.certificate!.verifyUrl} target="_blank" rel="noopener noreferrer" className={pillBtn}>
                          <ShieldCheck className="h-4 w-4" aria-hidden /> Verify
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Award} text="No certificates yet. Attend an event and get checked in at the entrance to receive one." />
              )}
            </section>
          )}

          {tab === 'resources' && (
            <section className={panel}>
              <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Member resources</h2>
              {isMember ? (
                data.resources.length ? (
                  <ul className="mt-5 divide-y divide-mist/[0.08]">
                    {data.resources.map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
                          <BookOpen className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-[var(--fg)]">{r.title}</span>
                          <span className="block text-[12.5px] text-[var(--muted)]">
                            {r.category} · {r.format}
                          </span>
                        </span>
                        {r.url ? (
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className={pillBtn}>
                            <ExternalLink className="h-4 w-4" aria-hidden /> Open
                          </a>
                        ) : (
                          <span className="text-[12.5px] text-[var(--muted)]">Coming soon</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon={BookOpen} text="No members-only resources have been published yet." action={{ href: '/resources', label: 'Open the library' }} />
                )
              ) : (
                <div className="mt-5 flex flex-col items-start gap-4 rounded-[22px] border border-gold/25 bg-gold/[0.06] p-6">
                  <Lock className="h-6 w-6 text-gold" aria-hidden />
                  <p className="text-[15px] leading-relaxed text-[var(--fg)]">
                    {data.membersOnlyCount > 0 ? `${data.membersOnlyCount} resource${data.membersOnlyCount === 1 ? ' is' : 's are'} reserved for members. ` : ''}
                    {membership?.state === 'pending'
                      ? 'Your membership application is being reviewed — they unlock once it is approved and paid.'
                      : membership?.state === 'awaiting_payment'
                        ? 'Your membership is approved — complete the payment on the Overview tab to unlock them.'
                        : membership?.state === 'expired'
                          ? 'Your membership has expired — renew it on the Overview tab to unlock them again.'
                          : !account.emailVerified
                        ? 'Confirm your email and become a member to unlock them.'
                        : 'Become a member to unlock them.'}
                  </p>
                  {!membership && (
                    <Link href="/join" className="inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950">
                      <Sparkles className="h-4 w-4" aria-hidden /> See membership plans
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}

          {tab === 'profile' && <ProfileTab data={data} />}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */

function Header({ data }: { data: DashboardData }) {
  const { account, membership, isMember } = data;
  const state = membership?.state;
  const status = isMember
    ? { label: `${membership?.plan ?? 'Member'} · Active`, cls: 'border-ok/40 bg-ok/10 text-ok' }
    : state === 'awaiting_payment'
      ? { label: 'Approved · payment due', cls: 'border-gold/40 bg-gold/10 text-gold' }
      : state === 'expired'
        ? { label: 'Membership expired', cls: 'border-bad/40 bg-bad/10 text-bad' }
        : state === 'pending'
          ? { label: 'Membership under review', cls: 'border-gold/40 bg-gold/10 text-gold' }
          : { label: 'Free account', cls: 'border-mist/20 bg-mist/[0.06] text-[var(--muted)]' };
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-mist/[0.1] bg-gradient-to-br from-brand-800/70 via-bg to-bg p-6 sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-[90px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-brand-500/25 blur-[90px]" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar name={account.name} photoUrl={account.profile.photoUrl} size="lg" />
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Member dashboard</p>
            <h1 className="mt-1 truncate font-display text-[clamp(28px,4vw,44px)] font-medium leading-[1.02] tracking-[-0.045em] text-[var(--fg)]">
              Hi, {account.name.replace(/^CA\s+/i, '').split(' ')[0]}.
            </h1>
            <p className="mt-1 truncate text-[14px] text-[var(--muted)]">{account.email}</p>
          </div>
        </div>
        <span className={cn('inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold sm:self-center', status.cls)}>
          {isMember ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Clock className="h-4 w-4" aria-hidden />}
          {status.label}
        </span>
      </div>
    </div>
  );
}

function Avatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-20 w-20 text-[24px]' : 'h-14 w-14 text-[18px]';
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt={`${name}'s profile photo`} className={cn(dim, 'shrink-0 rounded-full object-cover ring-2 ring-gold/50')} />
  ) : (
    <span className={cn(dim, 'grid shrink-0 place-items-center rounded-full bg-grad-primary font-semibold text-white ring-2 ring-gold/40')}>{getInitials(name)}</span>
  );
}

function VerifyBanner({ email, mailEnabled }: { email: string; mailEnabled: boolean }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const resend = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      toast(!res.ok ? d.error || 'Could not send the link.' : mailEnabled ? `New link sent to ${email}` : 'New link created — email sending is not set up yet, so it is saved in the server outbox.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div role="status" className="mt-5 flex flex-col gap-3 rounded-[22px] border border-gold/30 bg-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <p className="flex items-start gap-3 text-[14px] text-[var(--fg)]">
        <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
        <span>
          {mailEnabled ? (
            <>
              Confirm your email <strong>{email}</strong> — we sent you a link. Your bookings, receipts and certificates appear here once it’s
              confirmed.
            </>
          ) : (
            <>
              Confirm your email <strong>{email}</strong>. Email sending isn’t set up on this server yet, so the confirmation link was saved to
              the server’s outbox (data/outbox) instead of your inbox. Your bookings, receipts and certificates appear here once it’s confirmed.
            </>
          )}
        </span>
      </p>
      <button type="button" onClick={resend} disabled={busy} className={cn(pillBtn, 'shrink-0 border-gold/40 text-gold')}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Resend link
      </button>
    </div>
  );
}

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Starts a membership payment / renewal through Razorpay and refreshes the dashboard when done. */
function MembershipPayButton({ label, siteName, prefill }: { label: string; siteName: string; prefill: { name?: string; email?: string; contact?: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/membership/order', { method: 'POST' });
      const d = (await res.json().catch(() => ({}))) as {
        payment?: Extract<PaymentInit, { provider: 'razorpay' }> & { description?: string };
        error?: string;
      };
      if (!res.ok || !d.payment) {
        toast(d.error || 'Could not start the payment.');
        return;
      }
      const outcome = await payWithRazorpay({
        payment: d.payment,
        siteName,
        description: d.payment.description ?? 'Membership',
        prefill,
        verifyUrl: '/api/membership/verify',
      });
      if (outcome.kind === 'paid') {
        toast('Payment received — your membership is active!');
        await refresh();
        router.refresh();
      } else if (outcome.kind === 'failed') toast(outcome.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={pay}
      disabled={busy}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950 disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="h-4 w-4" aria-hidden />}
      {label}
    </button>
  );
}

function MembershipCard({
  membership,
  isMember,
  verified,
  siteName,
  prefill,
}: {
  membership: DashboardData['membership'];
  isMember: boolean;
  verified: boolean;
  siteName: string;
  prefill: { name?: string; email?: string; contact?: string };
}) {

  if (!membership) {
    return (
      <section className={cn(panel, 'holo relative overflow-hidden border-gold/25')}>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Membership</p>
        <h2 className="mt-2 font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">You have a free account.</h2>
        <p className="mt-2 max-w-[56ch] text-[14.5px] leading-relaxed text-[var(--muted)]">
          Become a member for wing membership, member-only resources, discussions and discounts on paid events.
          {!verified && ' Use the same email as this account and confirm it, so we can link your application.'}
        </p>
        <Link href="/join" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-grad-gold px-5 text-[14px] font-semibold text-brand-950">
          <Sparkles className="h-4 w-4" aria-hidden /> See membership plans
        </Link>
      </section>
    );
  }
  const state = membership.state;
  const label =
    state === 'active'
      ? 'Active'
      : state === 'awaiting_payment'
        ? 'Payment due'
        : state === 'expired'
          ? 'Expired'
          : state === 'pending'
            ? 'Under review'
            : 'Not approved';
  const tone =
    state === 'active'
      ? 'border-ok/40 bg-ok/10 text-ok'
      : state === 'awaiting_payment' || state === 'pending'
        ? 'border-gold/40 bg-gold/10 text-gold'
        : 'border-bad/40 bg-bad/10 text-bad';
  const until = membership.validUntil ? longDate(membership.validUntil) : '';
  const daysLeft = membership.validUntil ? Math.ceil((Date.parse(membership.validUntil) - Date.now()) / 86_400_000) : 0;
  const showPay = state === 'awaiting_payment' || state === 'expired' || (state === 'active' && daysLeft <= 30);
  return (
    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-gold">Membership</p>
          <h2 className="mt-2 font-display text-[24px] font-medium tracking-[-0.03em] text-[var(--fg)]">{membership.plan}</h2>
          <p className="mt-1 text-[13px] text-[var(--muted)]">
            {state === 'active'
              ? `Active until ${until}${daysLeft <= 30 ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}`
              : state === 'expired'
                ? `Expired on ${until}`
                : `Applied ${longDate(membership.appliedAt)}`}
          </p>
        </div>
        <span className={cn('rounded-full border px-3 py-1 text-[12.5px] font-semibold', tone)}>{label}</span>
      </div>
      {state === 'rejected' && (
        <p className="mt-4 text-[14px] text-[var(--muted)]">
          Your application was not approved.{' '}
          <Link href="/contact" className="text-[var(--fg)] underline underline-offset-2">
            Contact us
          </Link>{' '}
          if you have questions.
        </p>
      )}
      {state === 'pending' && (
        <p className="mt-4 text-[14px] text-[var(--muted)]">
          Our team is reviewing your application. Once approved, you can pay the annual fee here to activate it.
        </p>
      )}
      {showPay && (
        <div className="mt-5 flex flex-col gap-3 rounded-[20px] border border-gold/25 bg-gold/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-[var(--fg)]">
            {state === 'awaiting_payment'
              ? `Approved! Pay the annual fee of ${inr(membership.fee)} to activate your membership for 12 months.`
              : state === 'expired'
                ? `Renew for ${inr(membership.fee)} to restore your member benefits for 12 months.`
                : `Renew now for ${inr(membership.fee)} — the new 12 months start on ${until}, so you lose nothing.`}
          </p>
          {membership.canPayOnline ? (
            <MembershipPayButton
              label={state === 'awaiting_payment' ? `Pay ${inr(membership.fee)}` : `Renew · ${inr(membership.fee)}`}
              siteName={siteName}
              prefill={prefill}
            />
          ) : (
            <Link href="/contact?topic=membership#contact-form" className="shrink-0 text-[13.5px] font-semibold text-gold">
              Contact us to pay →
            </Link>
          )}
        </div>
      )}
      {membership.payments.length > 0 && (
        <details className="mt-5 rounded-[18px] border border-mist/[0.1] p-4">
          <summary className="cursor-pointer text-[13.5px] font-semibold text-[var(--fg)]">
            Payments &amp; receipts ({membership.payments.length})
          </summary>
          <ul className="mt-3 divide-y divide-mist/[0.08]">
            {membership.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-[13px]">
                <span className="font-mono text-[var(--fg)]">{p.id}</span>
                <span className="text-[var(--muted)]">
                  {longDate(p.paidAt)} · {p.method} · valid till {longDate(p.validUntil)}
                </span>
                <span className="ml-auto font-mono text-[var(--fg)]">{inr(p.amount)}</span>
                <a href={p.receiptUrl} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-200 hover:text-white">
                  <Download className="h-3.5 w-3.5" aria-hidden /> PDF
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
      {membership.wings.length > 0 && (
        <div className="mt-5">
          <p className="text-[12.5px] text-[var(--muted)]">Your wings</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {membership.wings.map((w) => (
              <Link key={w.slug} href={`/wings/${w.slug}`} className="rounded-full border border-mist/[0.14] px-3 py-1.5 text-[13px] text-[var(--fg)] hover:border-gold/50 hover:text-gold">
                {w.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      {isMember && (
        <Link href="/directory" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-mist/[0.16] px-4 text-[13.5px] font-semibold text-[var(--fg)] transition hover:border-brand-300/60 hover:bg-brand-500/10">
          <Users className="h-4 w-4 text-gold" aria-hidden /> Browse the member directory
        </Link>
      )}
    </section>
  );
}

function BookingList({ title, items, verified, past }: { title: string; items: DashboardBooking[]; verified: boolean; past?: boolean }) {
  return (
    <section>
      <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">
        {title} <span className="font-mono text-[14px] text-[var(--muted)]">{items.length}</span>
      </h2>
      {items.length ? (
        <ul className="mt-4 grid gap-4">
          {items.map((b) => (
            <li key={b.bookingId}>
              <BookingCard b={b} past={past} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          <EmptyState
            icon={Ticket}
            text={!verified ? 'Confirm your email to see bookings made with it.' : past ? 'No past events yet.' : 'No upcoming bookings.'}
            action={past ? undefined : { href: '/events', label: 'Explore events' }}
          />
        </div>
      )}
    </section>
  );
}

function BookingCard({ b, past }: { b: DashboardBooking; past?: boolean }) {
  const chip =
    b.status === 'cancelled'
      ? { label: b.paymentStatus === 'refunded' ? 'Refunded' : 'Cancelled', cls: 'bg-bad/10 text-bad border-bad/30' }
      : b.status === 'pending_payment'
        ? { label: b.paymentStatus === 'failed' ? 'Payment failed' : 'Payment due', cls: 'bg-gold/10 text-gold border-gold/30' }
        : { label: past ? 'Attended / past' : 'Confirmed', cls: 'bg-ok/10 text-ok border-ok/30' };
  return (
    <div className={cn('ticket-cut relative overflow-hidden rounded-[24px] border border-mist/[0.1] bg-grad-surface p-5 sm:p-6', past && 'opacity-80')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/events/${b.eventSlug}`} className="font-display text-[19px] font-medium leading-snug tracking-[-0.02em] text-[var(--fg)] hover:text-gold-soft">
            {b.eventTitle}
          </Link>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[var(--muted)]">
            {b.when && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden /> {b.when}
              </span>
            )}
            {b.where && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {b.where}
              </span>
            )}
          </p>
        </div>
        <span className={cn('shrink-0 rounded-full border px-3 py-1 text-[12px] font-semibold', chip.cls)}>{chip.label}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-mist/[0.12] pt-4">
        <span className="mr-auto font-mono text-[12.5px] text-[var(--muted)]">
          {b.bookingId} · {inr(b.fee)}
        </span>
        {b.payUrl && (
          <a href={b.payUrl} className="inline-flex h-10 items-center gap-2 rounded-full bg-grad-primary px-4 text-[13.5px] font-semibold text-white">
            <CreditCard className="h-4 w-4" aria-hidden /> Pay {inr(b.fee)}
          </a>
        )}
        <a href={b.bookingUrl} className={pillBtn}>
          <Ticket className="h-4 w-4" aria-hidden /> {b.status === 'confirmed' && !past ? 'Entry pass' : 'Booking'}
        </a>
        {b.receiptUrl && (
          <a href={b.receiptUrl} className={pillBtn}>
            <Download className="h-4 w-4" aria-hidden /> Receipt
          </a>
        )}
        {b.certificate && (
          <a href={b.certificate.pdfUrl} className={cn(pillBtn, 'border-gold/40 text-gold')}>
            <Award className="h-4 w-4" aria-hidden /> Certificate
          </a>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, action }: { icon: React.ElementType; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="mt-5 flex flex-col items-start gap-3 rounded-[22px] border border-dashed border-mist/[0.14] p-6">
      <Icon className="h-6 w-6 text-[var(--muted)]" aria-hidden />
      <p className="text-[14.5px] text-[var(--muted)]">{text}</p>
      {action && (
        <Link href={action.href} className="text-[13.5px] font-semibold text-brand-200 hover:text-white">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Profile & security                                                                          */
/* ------------------------------------------------------------------------------------------ */

const PROFILE_FIELDS: { key: string; label: string; placeholder?: string; full?: boolean; type?: string }[] = [
  { key: 'name', label: 'Full name' },
  { key: 'mobile', label: 'Mobile number', type: 'tel' },
  { key: 'city', label: 'City' },
  { key: 'membershipNo', label: 'CA membership number', placeholder: 'If applicable' },
  { key: 'qualificationYear', label: 'Year of qualification', placeholder: 'e.g. 2022' },
  { key: 'areaOfPractice', label: 'Area of practice', placeholder: 'e.g. Direct tax, audit' },
  { key: 'organisation', label: 'Firm / company' },
  { key: 'designation', label: 'Designation' },
  { key: 'linkedinUrl', label: 'LinkedIn profile', placeholder: 'https://linkedin.com/in/…', full: true, type: 'url' },
];

const inputCls =
  'w-full rounded-2xl border border-mist/[0.12] bg-field/80 px-4 py-3 text-[14.5px] text-white outline-none transition placeholder:text-faint focus:border-brand-500 focus:shadow-[0_0_0_4px_rgb(var(--lime-rgb)/0.18)]';

function ProfileTab({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const { account } = data;
  const [form, setForm] = useState<Record<string, string>>({
    name: account.name,
    mobile: account.mobile ?? '',
    city: account.profile.city ?? '',
    membershipNo: account.profile.membershipNo ?? '',
    qualificationYear: account.profile.qualificationYear ?? '',
    areaOfPractice: account.profile.areaOfPractice ?? '',
    organisation: account.profile.organisation ?? '',
    designation: account.profile.designation ?? '',
    linkedinUrl: account.profile.linkedinUrl ?? '',
    bio: account.profile.bio ?? '',
  });
  const [directoryOptIn, setDirectoryOptIn] = useState(!!account.profile.directoryOptIn);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, directoryOptIn }) });
      const d = (await res.json().catch(() => ({}))) as { error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok) {
        setErrors(d.fieldErrors ?? {});
        toast(d.error || 'Could not save your profile.');
        return;
      }
      toast('Profile saved');
      await refresh();
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PhotoCard name={account.name} photoUrl={account.profile.photoUrl} />

      <form onSubmit={save} className={panel} noValidate>
        <h2 className="font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">Professional profile</h2>
        <p className="mt-1 text-[13.5px] text-[var(--muted)]">
          Email: <strong className="text-[var(--fg)]">{account.email}</strong>
          {account.emailVerified ? (
            <span className="ml-2 inline-flex items-center gap-1 text-ok">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> confirmed
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 text-gold">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> not confirmed
            </span>
          )}
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {PROFILE_FIELDS.map((f) => (
            <label key={f.key} className={cn('flex flex-col gap-2', f.full && 'sm:col-span-2')}>
              <span className="text-[13px] font-medium text-[var(--fg)]">{f.label}</span>
              <input
                type={f.type ?? 'text'}
                value={form[f.key] ?? ''}
                placeholder={f.placeholder}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                className={inputCls}
              />
              {errors[f.key] && <span className="text-[12px] text-bad">{errors[f.key]}</span>}
            </label>
          ))}
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[13px] font-medium text-[var(--fg)]">Short bio</span>
            <textarea rows={3} maxLength={600} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className={cn(inputCls, 'resize-y')} />
            {errors.bio && <span className="text-[12px] text-bad">{errors.bio}</span>}
          </label>
        </div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-mist/[0.12] bg-mist/[0.03] p-4">
          <input
            type="checkbox"
            checked={directoryOptIn}
            onChange={(e) => setDirectoryOptIn(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--lime)]"
          />
          <span>
            <span className="block text-[14px] font-medium text-[var(--fg)]">Show me in the member directory</span>
            <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--muted)]">
              Other approved members can see your name, photo, designation, firm, city, area of practice, qualification year, bio, wings and
              LinkedIn. Your email, phone and membership number are never shown.
              {!data.isMember && ' Your listing appears once your membership is approved.'}
            </span>
          </span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-grad-primary px-6 text-[14.5px] font-semibold text-white disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Save profile
        </button>
      </form>

      <PasswordCard />
    </div>
  );
}

function PhotoCard({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast('The photo must be under 2 MB.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/account/photo', { method: 'POST', body: fd });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast(d.error || 'Upload failed.');
        return;
      }
      toast('Photo updated');
      await refresh();
      router.refresh();
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  return (
    <section className={cn(panel, 'flex flex-wrap items-center gap-5')}>
      <Avatar name={name} photoUrl={photoUrl} size="lg" />
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-[20px] font-medium tracking-[-0.02em] text-[var(--fg)]">Profile photograph</h2>
        <p className="mt-1 text-[13px] text-[var(--muted)]">JPG, PNG or WebP, up to 2 MB. A clear, professional headshot works best.</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Upload profile photo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className={pillBtn}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
        {photoUrl ? 'Change photo' : 'Upload photo'}
      </button>
    </section>
  );
}

function PasswordCard() {
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(d.error || 'Could not change the password.');
        return;
      }
      setCurrent('');
      setNext('');
      toast('Password changed. Other devices have been signed out.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={panel} noValidate>
      <h2 className="flex items-center gap-2 font-display text-[22px] font-medium tracking-[-0.03em] text-[var(--fg)]">
        <KeyRound className="h-5 w-5 text-gold" aria-hidden /> Change password
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[var(--fg)]">Current password</span>
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-medium text-[var(--fg)]">New password</span>
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
          <span className="text-[12px] text-[var(--muted)]">At least 8 characters, with letters and a number.</span>
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-[13px] text-bad">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !current || !next} className={cn(pillBtn, 'mt-5 h-11')}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Update password
      </button>
    </form>
  );
}
