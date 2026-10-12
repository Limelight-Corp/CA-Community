'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Save } from 'lucide-react';
import { legalTextToSections } from '@ascend/shared';
import { Button, cn, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { Chip, Panel } from '../ui/Display';
import { ConfirmDialog, TextAreaField, TextField } from '../ui/Controls';

interface LegalText {
  title: string;
  summary: string;
  content: string;
}

export interface LegalEditorDoc {
  slug: string;
  defaults: LegalText;
  current: LegalText;
  edited: boolean;
  updatedAt?: string;
}

export function LegalEditor({ docs }: { docs: LegalEditorDoc[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [slug, setSlug] = useState(docs[0]!.slug);
  const doc = docs.find((d) => d.slug === slug)!;
  const [drafts, setDrafts] = useState<Record<string, LegalText>>(() => Object.fromEntries(docs.map((d) => [d.slug, d.current])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const draft = drafts[slug]!;
  const set = (k: keyof LegalText, v: string) => setDrafts((p) => ({ ...p, [slug]: { ...p[slug]!, [k]: v } }));
  const dirty = (d: LegalEditorDoc) => JSON.stringify(drafts[d.slug]) !== JSON.stringify(d.current);
  const sections = legalTextToSections(draft.content);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!draft.title.trim()) found.title = 'Title is required';
    if (!draft.summary.trim()) found.summary = 'Summary is required';
    if (!sections.some((s) => s.heading && s.body.length)) found.content = 'Add at least one "## Heading" followed by a paragraph';
    setErrors(found);
    if (Object.keys(found).length) {
      toast('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    const res = await api('/api/legal', { method: 'PUT', body: { slug, ...draft } });
    setSaving(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast(res.error ?? 'Could not save the page');
      return;
    }
    toast('Saved — the website shows the new wording within a minute');
    router.refresh();
  };

  const reset = async () => {
    setSaving(true);
    const res = await api(`/api/legal?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    setSaving(false);
    setConfirmReset(false);
    if (!res.ok) {
      toast(res.error ?? 'Could not reset the page');
      return;
    }
    setDrafts((p) => ({ ...p, [slug]: doc.defaults }));
    toast('Back to the default wording');
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <nav aria-label="Legal pages" className="lg:sticky lg:top-24 lg:self-start">
        <ul className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {docs.map((d) => (
            <li key={d.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSlug(d.slug);
                  setErrors({});
                }}
                aria-current={d.slug === slug ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left text-[14px] transition',
                  d.slug === slug ? 'bg-brand-300/10 text-[var(--fg)] ring-1 ring-brand-300/40' : 'text-[var(--muted)] hover:bg-mist/[0.06] hover:text-[var(--fg)]'
                )}
              >
                <span>{drafts[d.slug]!.title || d.defaults.title}</span>
                {dirty(d) ? <Chip tone="warn">Unsaved</Chip> : d.edited ? <Chip tone="ok">Edited</Chip> : <Chip>Draft</Chip>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <form onSubmit={save} noValidate className="flex min-w-0 flex-col gap-6">
        <Panel
          title={doc.defaults.title}
          description={
            doc.edited && doc.updatedAt
              ? `Your wording, last saved ${new Date(doc.updatedAt).toLocaleString('en-IN')}`
              : 'Showing the default draft wording. Have it reviewed by your legal / professional advisor before publishing.'
          }
        >
          <div className="grid grid-cols-1 gap-5">
            <TextField label="Title" required value={draft.title} onChange={(v) => set('title', v)} error={errors.title} maxLength={120} />
            <TextAreaField label="Summary" required value={draft.summary} onChange={(v) => set('summary', v)} error={errors.summary} maxLength={400} rows={2} hint="One or two sentences shown under the title and in search results" />
            <TextAreaField
              label="Page text"
              required
              value={draft.content}
              onChange={(v) => set('content', v)}
              error={errors.content}
              maxLength={60000}
              rows={22}
              hint='Start each section with a line like "## Information we collect". Leave a blank line between paragraphs.'
            />
          </div>
        </Panel>

        <Panel title="Preview" description={`${sections.length} section${sections.length === 1 ? '' : 's'}`}>
          <div className="flex max-w-[70ch] flex-col gap-6">
            <p className="text-[14px] text-[var(--muted)]">{draft.summary}</p>
            {sections.map((s, i) => (
              <section key={i} className="flex flex-col gap-2">
                {s.heading && (
                  <h3 className="font-display text-[19px] font-medium text-[var(--fg)]">
                    <span className="mr-2 font-mono text-[11px] text-gold">{String(i + 1).padStart(2, '0')}</span>
                    {s.heading}
                  </h3>
                )}
                {s.body.map((p, j) => (
                  <p key={j} className="text-[14px] leading-relaxed text-[var(--muted)]">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </Panel>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {doc.edited && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReset(true)} disabled={saving}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset to default
            </Button>
          )}
          <Button type="submit" size="sm" isLoading={saving} disabled={!dirty(doc) && doc.edited}>
            {!saving && <Save className="h-4 w-4" aria-hidden />}
            Save page
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReset}
        title={`Reset “${doc.defaults.title}”?`}
        description="Your wording for this page is deleted and the website shows the default draft text again."
        confirmLabel="Reset to default"
        danger
        busy={saving}
        onConfirm={reset}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
