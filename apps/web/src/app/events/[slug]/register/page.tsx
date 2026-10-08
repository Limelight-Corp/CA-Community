'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { WebShell } from '../../../../components/WebShell';
import {
  Heading,
  Badge,
  Button,
  Input,
  BackIcon,
  useToast,
} from '@ascend/ui';
import { PROTOTYPE_EVENTS, PROTOTYPE_WINGS } from '@ascend/shared';

export default function EventRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params?.slug as string;

  const event = PROTOTYPE_EVENTS.find((e) => e.slug === slug) || PROTOTYPE_EVENTS[0]!;
  const wing = PROTOTYPE_WINGS.find((w) => w.number === event.wingNumber);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [attendee, setAttendee] = useState({
    name: '',
    email: '',
    mobile: '',
    mno: '',
    city: event.city !== 'Online' ? event.city : 'New Delhi',
    org: '',
    gstin: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  // Server-computed pricing breakdown simulation
  const isMember = !!attendee.mno;
  const baseFee = isMember ? event.memberFee : event.fee;
  const taxableAmount = Math.round(baseFee / 1.18);
  const gstAmount = baseFee - taxableAmount;
  const totalAmount = baseFee;

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendee.name || !attendee.email || !attendee.mobile) {
      toast('Please provide your name, email, and mobile number');
      return;
    }
    setStep(2);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);

    // Call API / simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      const prefix = 'ASC27';
      const slugCode = event.slug.substring(0, 3).toUpperCase();
      const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
      const code = `${prefix}-${slugCode}-${randomSeq}`;

      setBookingCode(code);
      setStep(3);

      // Persist to local offline storage for PWA access without internet
      try {
        const storedPass = {
          id: event.slug,
          title: event.title,
          date: event.date,
          venue: event.venue,
          bookingCode: code,
          status: 'Confirmed',
        };
        const existing = JSON.parse(localStorage.getItem('ascend_offline_passes') || '[]');
        const updated = [storedPass, ...(Array.isArray(existing) ? existing.filter((p: any) => p.bookingCode !== code) : [])];
        localStorage.setItem('ascend_offline_passes', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not cache pass offline:', err);
      }

      toast('Registration confirmed! Pass issued and cached offline.');
    }, 1200);
  };

  return (
    <WebShell>
      {/* Header */}
      <section className="py-12 md:py-16 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgba(15,56,192,0.38),transparent_70%)]">
        <div className="max-w-[840px] mx-auto px-5 md:px-8">
          <button
            onClick={() => (step > 1 && step < 3 ? setStep((step - 1) as any) : router.push(`/events/${event.slug}`))}
            className="inline-flex items-center gap-2 text-[13px] font-mono text-[var(--muted)] hover:text-[var(--fg)] mb-6 transition-colors"
          >
            <BackIcon size={14} />
            <span>{step === 2 ? 'Back to Attendee Info' : 'Back to Event Details'}</span>
          </button>

          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-[12px] uppercase tracking-wider text-[var(--accent)] font-semibold">
              Step {step} of 3
            </span>
            <span className="text-[var(--faint)]">·</span>
            <span className="text-[13px] text-[var(--muted)]">
              {step === 1 ? 'Attendee Details' : step === 2 ? 'Review & Payment' : 'Confirmed Pass'}
            </span>
          </div>

          <Heading level="h1" className="text-[clamp(28px,4cqi,44px)]">
            Registration: {event.title}
          </Heading>
        </div>
      </section>

      {/* Main Checkout Section */}
      <section className="py-12 md:py-20 max-w-[840px] mx-auto px-5 md:px-8">
        {step === 1 && (
          <form onSubmit={handleProceedToPayment} className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-10 flex flex-col gap-6">
            <h2 className="font-display text-[22px] font-medium text-[var(--fg)] border-b border-[var(--line)] pb-4">
              1. Attendee Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                  Full Name *
                </label>
                <Input
                  placeholder="CA Priya Sharma"
                  value={attendee.name}
                  onChange={(e) => setAttendee({ ...attendee, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  placeholder="priya@firm.com"
                  value={attendee.email}
                  onChange={(e) => setAttendee({ ...attendee, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                  Mobile / WhatsApp *
                </label>
                <Input
                  placeholder="+91 98765 43210"
                  value={attendee.mobile}
                  onChange={(e) => setAttendee({ ...attendee, mobile: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                  City *
                </label>
                <Input
                  placeholder="e.g. Mumbai"
                  value={attendee.city}
                  onChange={(e) => setAttendee({ ...attendee, city: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                  ICAI Membership No. (MRN)
                </label>
                <Input
                  placeholder="e.g. 512345 (Optional)"
                  value={attendee.mno}
                  onChange={(e) => setAttendee({ ...attendee, mno: e.target.value })}
                />
                <span className="text-[11.5px] text-[var(--faint)] mt-1 block">
                  Unlocks member discounted fee if verified.
                </span>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                  Firm / Organization Name
                </label>
                <Input
                  placeholder="e.g. Sharma & Associates"
                  value={attendee.org}
                  onChange={(e) => setAttendee({ ...attendee, org: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                GSTIN for Tax Invoice (Optional)
              </label>
              <Input
                placeholder="27AAAAA0000A1Z5"
                value={attendee.gstin}
                onChange={(e) => setAttendee({ ...attendee, gstin: e.target.value.toUpperCase() })}
              />
              <span className="text-[11.5px] text-[var(--faint)] mt-1 block">
                Required for corporate Input Tax Credit (ITC).
              </span>
            </div>

            <div className="pt-4 border-t border-[var(--line)] flex justify-between items-center">
              <div>
                <span className="block text-[12px] text-[var(--muted)]">Calculated Fee</span>
                <span className="font-display text-[22px] font-medium text-[var(--fg)]">
                  {totalAmount === 0 ? 'Free' : `₹${totalAmount.toLocaleString('en-IN')}`}
                </span>
              </div>

              <Button type="submit" variant="primary" size="lg">
                Continue to Payment →
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-10 flex flex-col gap-6">
            <h2 className="font-display text-[22px] font-medium text-[var(--fg)] border-b border-[var(--line)] pb-4">
              2. Order Summary & Payment Mode
            </h2>

            {/* Summary Box */}
            <div className="p-6 rounded-[var(--r)] bg-[var(--surface-muted)] border border-[var(--line)] flex flex-col gap-3">
              <div className="flex justify-between items-center text-[14.5px]">
                <span className="text-[var(--muted)]">Registration: {event.title}</span>
                <span className="font-mono text-[var(--fg)]">₹{taxableAmount}</span>
              </div>
              <div className="flex justify-between items-center text-[13.5px]">
                <span className="text-[var(--muted)]">Goods & Services Tax (GST 18% - SAC 998399)</span>
                <span className="font-mono text-[var(--fg)]">₹{gstAmount}</span>
              </div>
              {isMember && event.fee > event.memberFee && (
                <div className="flex justify-between items-center text-[13.5px] text-[var(--success)]">
                  <span>Member Privilege Discount Applied</span>
                  <span className="font-mono">-₹{event.fee - event.memberFee}</span>
                </div>
              )}
              <div className="pt-3 border-t border-[var(--line)] flex justify-between items-baseline">
                <span className="font-medium text-[16px] text-[var(--fg)]">Grand Total (Inclusive of GST)</span>
                <span className="font-display text-[26px] font-medium text-[var(--accent)]">
                  {totalAmount === 0 ? 'Free' : `₹${totalAmount.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            {totalAmount > 0 && (
              <div className="flex flex-col gap-3">
                <label className="text-[13px] font-medium text-[var(--fg)]">
                  Select Payment Option (Razorpay Gateway)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['UPI', 'CARD', 'NETBANKING', 'WALLET'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-4 rounded-[var(--r)] border text-center transition-all ${
                        paymentMethod === method
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--fg)] shadow-sm'
                          : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--line-strong)]'
                      }`}
                    >
                      <span className="font-mono text-[13px] font-medium block">{method}</span>
                      <span className="text-[11px] text-[var(--faint)] block mt-1">
                        {method === 'UPI' ? 'GPay / PhonePe' : method === 'CARD' ? 'Visa / MC' : method === 'NETBANKING' ? 'All Banks' : 'Paytm / Others'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 rounded-[var(--r)] bg-[rgba(15,56,192,0.1)] border border-[var(--line)] text-[13px] text-[var(--muted)]">
              🔒 256-bit SSL encrypted checkout. Server-verified HMAC cryptographic token guarantees idempotent charge.
            </div>

            <div className="pt-4 border-t border-[var(--line)] flex justify-between items-center">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Edit Details
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Verifying Payment...' : totalAmount === 0 ? 'Confirm Free Pass' : `Pay ₹${totalAmount.toLocaleString('en-IN')} & Confirm`}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--glow)] text-[var(--accent)] border border-[var(--line-strong)] grid place-items-center text-[28px] mb-4">
              ✓
            </div>

            <Badge variant="green" className="mb-2">Registration Confirmed</Badge>
            <h2 className="font-display text-[28px] md:text-[34px] font-medium text-[var(--fg)] mb-2">
              You're all set!
            </h2>
            <p className="text-[15px] text-[var(--muted)] max-w-[46ch] mb-8">
              A digital admission pass and GST Tax Invoice have been emailed to{' '}
              <span className="text-[var(--fg)] font-mono">{attendee.email}</span>.
            </p>

            {/* Pass Card */}
            <div className="w-full max-w-[480px] p-6 rounded-[var(--r)] border border-[var(--line-strong)] bg-[linear-gradient(145deg,#070D28,#03050F)] text-left flex flex-col gap-5 shadow-2xl mb-8">
              <div className="flex justify-between items-start border-b border-[var(--line)] pb-4">
                <div>
                  <span className="font-mono text-[11px] text-[var(--muted)] uppercase tracking-wider block">
                    Official Admission Pass
                  </span>
                  <h3 className="font-display text-[19px] font-medium text-[var(--fg)]">
                    {event.title}
                  </h3>
                </div>
                {wing && (
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded border"
                    style={{ borderColor: wing.color, color: wing.color }}
                  >
                    W0{wing.number}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div>
                  <span className="text-[var(--muted)] block">Attendee</span>
                  <span className="font-medium text-[var(--fg)] block">{attendee.name}</span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block">Booking Reference</span>
                  <span className="font-mono text-[var(--accent)] font-semibold block">{bookingCode}</span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block">Date & Time</span>
                  <span className="font-mono text-[var(--fg)] block">{event.date} · {event.time}</span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block">Venue</span>
                  <span className="text-[var(--fg)] block truncate">{event.venue}</span>
                </div>
              </div>

              {/* Dynamic QR Code representation */}
              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between">
                <div className="w-20 h-20 bg-white p-1 rounded grid place-items-center shadow-inner">
                  {/* Clean SVG QR pattern */}
                  <svg viewBox="0 0 24 24" className="w-full h-full text-black fill-current">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v2h-2v-2zm-4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2zm-2 4h2v2h-2v-2zm2 2h2v2h-2v-2zm-6-2h2v2h-2v-2zm2 2h2v2h-2v-2z" />
                  </svg>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono text-[var(--faint)] block">SCAN AT RECEPTION</span>
                  <span className="text-[12px] font-mono text-[var(--muted)] block">SECURE TOKEN VALID</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[rgba(184,255,44,0.08)] border border-[rgba(184,255,44,0.2)] text-[12px] font-mono text-[var(--lime)] text-center flex items-center justify-center gap-2">
                <span>📱 Pass cached for offline access · Available without network</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="secondary" onClick={() => window.print()}>
                Download / Print Pass
              </Button>

              <Link href="/dashboard">
                <Button variant="primary">
                  Go to Member Dashboard →
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>
    </WebShell>
  );
}
