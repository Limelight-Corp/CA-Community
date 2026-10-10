'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { MEMBERSHIP_PLANS, membershipFeeFor, type SiteSettings } from '@ascend/shared';
import { Button, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { Panel } from '../ui/Display';
import { ImageUpload, TextAreaField, TextField } from '../ui/Controls';

interface State {
  siteName: string;
  tagline: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroHeadlineAccent: string;
  heroIntro: string;
  heroImageUrl: string;
  announcement: string;
  fees: { core: string; associate: string; student: string };
  contact: { email: string; phone: string; address: string; mapUrl: string };
  social: { linkedin: string; instagram: string; facebook: string; youtube: string; x: string };
}

function toState(s: SiteSettings): State {
  return {
    siteName: s.siteName ?? '',
    tagline: s.tagline ?? '',
    heroEyebrow: s.heroEyebrow ?? '',
    heroHeadline: s.heroHeadline ?? '',
    heroHeadlineAccent: s.heroHeadlineAccent ?? '',
    heroIntro: s.heroIntro ?? '',
    heroImageUrl: s.heroImageUrl ?? '',
    fees: {
      core: String(membershipFeeFor('core', s)),
      associate: String(membershipFeeFor('associate', s)),
      student: String(membershipFeeFor('student', s)),
    },
    announcement: s.announcement ?? '',
    contact: {
      email: s.contact?.email ?? '',
      phone: s.contact?.phone ?? '',
      address: s.contact?.address ?? '',
      mapUrl: s.contact?.mapUrl ?? '',
    },
    social: {
      linkedin: s.social?.linkedin ?? '',
      instagram: s.social?.instagram ?? '',
      facebook: s.social?.facebook ?? '',
      youtube: s.social?.youtube ?? '',
      x: s.social?.x ?? '',
    },
  };
}

const SOCIAL: { key: keyof State['social']; label: string }[] = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'x', label: 'X (Twitter)' },
];

const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter();
  const { toast } = useToast();
  const [s, setS] = useState<State>(() => toState(settings));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const setContact = (k: keyof State['contact'], v: string) => setS((p) => ({ ...p, contact: { ...p.contact, [k]: v } }));
  const setSocial = (k: keyof State['social'], v: string) => setS((p) => ({ ...p, social: { ...p.social, [k]: v } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!s.siteName.trim()) found.siteName = 'Site name is required';
    if (!s.heroHeadline.trim()) found.heroHeadline = 'Hero headline is required';
    if (s.contact.email && !/^\S+@\S+\.\S+$/.test(s.contact.email.trim())) found['contact.email'] = 'Enter a valid email';
    if (s.contact.mapUrl && !isUrl(s.contact.mapUrl.trim())) found['contact.mapUrl'] = 'Enter a full URL starting with https://';
    for (const { key } of SOCIAL) if (s.social[key] && !isUrl(s.social[key].trim())) found[`social.${key}`] = 'Enter a full URL starting with https://';
    setErrors(found);
    if (Object.keys(found).length) {
      toast('Please fix the highlighted fields');
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    setSaving(true);
    const { fees, ...rest } = s;
    const res = await api('/api/settings', {
      method: 'PUT',
      body: { ...rest, membershipFees: { core: Number(fees.core), associate: Number(fees.associate), student: Number(fees.student) } },
    });
    setSaving(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast(res.error ?? 'Could not save settings');
      return;
    }
    toast('Settings saved — the website is updated');
    router.refresh();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Panel title="Homepage banner" description="The hero section at the top of the homepage">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField label="Eyebrow" value={s.heroEyebrow} onChange={(v) => set('heroEyebrow', v)} error={errors.heroEyebrow} maxLength={160} hint="Small label above the headline" className="md:col-span-2" />
          <TextField label="Headline" required value={s.heroHeadline} onChange={(v) => set('heroHeadline', v)} error={errors.heroHeadline} maxLength={160} />
          <TextField label="Headline accent" value={s.heroHeadlineAccent} onChange={(v) => set('heroHeadlineAccent', v)} error={errors.heroHeadlineAccent} maxLength={120} hint="Highlighted words after the headline" />
          <TextAreaField label="Intro paragraph" value={s.heroIntro} onChange={(v) => set('heroIntro', v)} error={errors.heroIntro} maxLength={600} className="md:col-span-2" />
          <ImageUpload
            label="Background photo (optional)"
            value={s.heroImageUrl}
            onChange={(v) => set('heroImageUrl', v)}
            error={errors.heroImageUrl}
            hint="Wide photo, ideally 1920px or more. It is darkened automatically so the text stays readable. PNG, JPEG or WebP · up to 5 MB"
            className="md:col-span-2"
          />
        </div>
        <div className="mt-6 rounded-2xl border border-mist/[0.08] bg-bg/60 p-5" aria-hidden>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-brand-200">{s.heroEyebrow || 'Eyebrow'}</p>
          <p className="mt-2 font-display text-[clamp(22px,3vw,34px)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--fg)]">
            {s.heroHeadline || 'Headline'} <em className="font-serif font-normal italic text-gold-gradient">{s.heroHeadlineAccent}</em>
          </p>
          <p className="mt-2 max-w-[60ch] text-[13.5px] text-[var(--muted)]">{s.heroIntro}</p>
        </div>
      </Panel>

      <Panel title="Membership fees" description="Annual fee per plan (₹). Applies to applications approved after saving and to renewals.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {MEMBERSHIP_PLANS.map((p) => (
            <TextField
              key={p.key}
              label={`${p.name} (₹ / year)`}
              value={s.fees[p.key]}
              onChange={(v) => setS((prev) => ({ ...prev, fees: { ...prev.fees, [p.key]: v.replace(/[^0-9]/g, '') } }))}
              error={errors[`membershipFees.${p.key}`]}
              inputMode="numeric"
              hint={`Blueprint price: ₹${p.price.toLocaleString('en-IN')}`}
            />
          ))}
        </div>
      </Panel>

      <div id="announcement" className="scroll-mt-24">
        <Panel title="Announcement bar" description="Optional strip shown above the website header. Leave empty to hide it.">
          <TextField label="Announcement text" value={s.announcement} onChange={(v) => set('announcement', v)} error={errors.announcement} maxLength={300} />
        </Panel>
      </div>

      <Panel title="Site identity">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField label="Site name" required value={s.siteName} onChange={(v) => set('siteName', v)} error={errors.siteName} maxLength={80} />
          <TextField label="Tagline" value={s.tagline} onChange={(v) => set('tagline', v)} error={errors.tagline} maxLength={200} />
        </div>
      </Panel>

      <Panel title="Contact details" description="Shown on the contact page and footer">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <TextField label="Email" type="email" value={s.contact.email} onChange={(v) => setContact('email', v)} error={errors['contact.email']} />
          <TextField label="Phone" type="tel" value={s.contact.phone} onChange={(v) => setContact('phone', v)} error={errors['contact.phone']} />
          <TextAreaField label="Office address" rows={3} value={s.contact.address} onChange={(v) => setContact('address', v)} error={errors['contact.address']} className="md:col-span-2" />
          <TextField label="Google Maps link" type="url" value={s.contact.mapUrl} onChange={(v) => setContact('mapUrl', v)} error={errors['contact.mapUrl']} placeholder="https://maps.google.com/…" className="md:col-span-2" />
        </div>
      </Panel>

      <Panel title="Social media" description="Leave a field empty to hide that icon">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {SOCIAL.map(({ key, label }) => (
            <TextField key={key} label={label} type="url" value={s.social[key]} onChange={(v) => setSocial(key, v)} error={errors[`social.${key}`]} placeholder="https://" />
          ))}
        </div>
      </Panel>

      <div className="sticky bottom-3 z-20 flex justify-end rounded-token-lg border border-mist/[0.12] bg-panel/90 p-3 backdrop-blur-xl">
        <Button type="submit" size="sm" isLoading={saving} className="w-full sm:w-auto">
          {!saving && <Save className="h-4 w-4" aria-hidden />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
