'use client';

import React, { useState } from 'react';
import { WebShell } from '../../components/WebShell';
import { Heading, Eyebrow, Button, Input, Select, useToast } from '@ascend/ui';

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Membership Inquiry',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const offices = [
    {
      city: 'National Secretariat · New Delhi',
      address: 'Core 4B, 4th Floor, India Habitat Centre, Lodhi Road, New Delhi 110003',
      email: 'secretariat@ascendca.in',
      phone: '+91 11 4987 6500',
    },
    {
      city: 'Western Chapter · Mumbai',
      address: 'Level 14, Platina, Bandra Kurla Complex (BKC), Bandra East, Mumbai 400051',
      email: 'mumbai@ascendca.in',
      phone: '+91 22 6123 4500',
    },
    {
      city: 'Southern Chapter · Bengaluru',
      address: 'Prestige Meridian, 29 M.G. Road, Bengaluru 560001',
      email: 'bengaluru@ascendca.in',
      phone: '+91 80 4112 8900',
    },
    {
      city: 'Pune Chapter · Pune',
      address: 'ICC Trade Tower, Senapati Bapat Road, Pune 411016',
      email: 'pune@ascendca.in',
      phone: '+91 20 2567 1100',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast('Thank you! Your message has been routed to the Secretariat.');
    }, 800);
  };

  return (
    <WebShell>
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-[var(--line)] bg-[radial-gradient(50%_80%_at_90%_0%,rgb(var(--cobalt-rgb)/0.38),transparent_70%)]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <Eyebrow pill>Contact & Chapters</Eyebrow>
          <Heading level="h1" className="text-[clamp(40px,5.5cqi,72px)] mt-6 max-w-[16ch]">
            Connect with the{' '}
            <em className="s font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-brand-200 to-mist">
              community.
            </em>
          </Heading>
          <p className="text-[17px] text-[var(--muted)] font-light mt-4 max-w-[56ch] leading-relaxed">
            Reach out for membership queries, wing participation, event partnerships, or speaker nominations.
          </p>
        </div>
      </section>

      {/* Main Grid: Form + Office Locations */}
      <section className="py-16 md:py-24 max-w-[1200px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Contact Form */}
          <div className="lg:col-span-7 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-8 md:p-10 backdrop-blur-md">
            <h2 className="font-display text-[26px] font-medium tracking-tight text-[var(--fg)] mb-2">
              Send an inquiry
            </h2>
            <p className="text-[14.5px] text-[var(--muted)] mb-8">
              The national desk responds within one business day.
            </p>

            {submitted ? (
              <div className="py-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-[var(--glow)] text-[var(--accent)] border border-[var(--line-strong)] grid place-items-center text-[28px] mb-4">
                  ✓
                </div>
                <h3 className="font-display text-[22px] font-medium text-[var(--fg)] mb-2">
                  Inquiry Received
                </h3>
                <p className="text-[14.5px] text-[var(--muted)] max-w-[42ch] mb-6">
                  We have logged your query. A confirmation reference has been sent to{' '}
                  <span className="text-[var(--fg)] font-mono">{formData.email}</span>.
                </p>
                <Button variant="secondary" onClick={() => setSubmitted(false)}>
                  Send another inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                    Full Name *
                  </label>
                  <Input
                    placeholder="CA Rohan Mehta"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="rohan@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                      Phone / WhatsApp
                    </label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                    Inquiry Topic
                  </label>
                  <Select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    options={[
                      { value: 'Membership Inquiry', label: 'Membership & Registration' },
                      { value: 'Wing Committee Participation', label: 'Wing Committee Participation' },
                      { value: 'Event Sponsorship', label: 'Event Sponsorship & Partnerships' },
                      { value: 'Speaker Nomination', label: 'Speaker Nomination' },
                      { value: 'Press & Secretariat', label: 'Press & Secretariat Inquiries' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                    Message *
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-[var(--surface-muted)] text-[var(--fg)] border border-[var(--line)] rounded-[var(--r)] px-4 py-3 text-[14.5px] outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--faint)]"
                    placeholder="Describe your requirement or question..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="mt-2 w-full sm:w-auto self-start"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </Button>
              </form>
            )}
          </div>

          {/* Regional Offices */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="font-display text-[22px] font-medium tracking-tight text-[var(--fg)]">
              Secretariat & City Hubs
            </h2>

            <div className="flex flex-col gap-4">
              {offices.map((office, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[var(--r)] border border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)] transition-colors"
                >
                  <h3 className="text-[16px] font-medium text-[var(--fg)] mb-2">
                    {office.city}
                  </h3>
                  <p className="text-[13.5px] text-[var(--muted)] leading-relaxed mb-4">
                    {office.address}
                  </p>
                  <div className="flex flex-wrap gap-y-2 gap-x-5 text-[12.5px] font-mono text-[var(--accent)]">
                    <a href={`mailto:${office.email}`} className="hover:underline">
                      {office.email}
                    </a>
                    <a href={`tel:${office.phone.replace(/[^0-9+]/g, '')}`} className="hover:underline">
                      {office.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-[var(--r)] border border-[var(--line)] bg-[linear-gradient(135deg,rgb(var(--cobalt-rgb)/0.15),transparent)]">
              <h4 className="text-[14px] font-medium text-[var(--fg)] mb-1">
                Direct Grievance Redressal
              </h4>
              <p className="text-[13px] text-[var(--muted)] leading-relaxed">
                Members may escalate unresolved service or verification requests directly to{' '}
                <a href="mailto:ombudsman@ascendca.in" className="text-[var(--accent)] hover:underline font-mono">
                  ombudsman@ascendca.in
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </WebShell>
  );
}
