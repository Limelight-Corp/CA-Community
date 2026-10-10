'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Trash2 } from 'lucide-react';
import { Button, cn, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { CONTENT_TYPES, defaultValues, type FieldDef, type ManagedContentType } from '../../lib/content-config';
import { slugify } from '../../lib/format';
import { Panel } from '../ui/Display';
import { ConfirmDialog, FileUpload, ImageUpload, ListField, SelectField, Switch, TextAreaField, TextField } from '../ui/Controls';
import { PointsEditor, StatsEditor, type StatItem } from './ListEditors';

type Values = Record<string, unknown>;

function initialValues(type: ManagedContentType, item?: Values): Values {
  const config = CONTENT_TYPES[type];
  const base = defaultValues(config);
  if (!item) return base;
  const out: Values = { ...base };
  for (const f of config.fields) {
    const v = item[f.name];
    if (v === undefined || v === null) continue;
    if (f.kind === 'number') out[f.name] = String(v);
    else out[f.name] = v;
  }
  return out;
}

function uniqueSlug(base: string, taken: Set<string>): string {
  const root = base || 'item';
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

/** Client-side checks mirroring lib/content-validation.ts (the server re-validates). */
function validateField(f: FieldDef, value: unknown, taken: Set<string>): string | undefined {
  const str = typeof value === 'string' ? value.trim() : '';
  switch (f.kind) {
    case 'text':
    case 'textarea':
    case 'richtext':
    case 'select':
      if (f.required && !str) return `${f.label} is required`;
      if (f.max && str.length > f.max) return `Keep this under ${f.max} characters`;
      return undefined;
    case 'slug':
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str)) return 'Use lowercase letters, numbers and hyphens only';
      if (taken.has(str)) return 'Another item already uses this slug';
      return undefined;
    case 'number': {
      const n = Number(value);
      if (String(value).trim() === '' || !Number.isInteger(n)) return `${f.label} must be a whole number`;
      if (f.min !== undefined && n < f.min) return `${f.label} must be at least ${f.min}`;
      if (f.max !== undefined && n > f.max) return `${f.label} must be at most ${f.max}`;
      return undefined;
    }
    case 'date':
      if (f.required && !str) return `${f.label} is required`;
      return undefined;
    case 'url':
      if (!str) return undefined;
      if (f.name === 'ctaUrl') {
        return /^\/(?!\/)\S*$/.test(str) || /^https?:\/\/\S+$/i.test(str) ? undefined : 'Enter a site path starting with / or a full https:// URL';
      }
      return /^https?:\/\/\S+$/i.test(str) ? undefined : 'Enter a full URL starting with https://';
    case 'file':
      if (!str) return undefined;
      return /^\/(?!\/)\S*$/.test(str) || /^https?:\/\/\S+$/i.test(str) ? undefined : 'Upload a file or paste a full https:// link';
    case 'color':
      return /^#[0-9a-fA-F]{6}$/.test(str) ? undefined : 'Use a hex colour like #2F6FE4';
    case 'stats': {
      const rows = ((value as StatItem[]) ?? []).filter((s) => s.value.trim() || s.label.trim());
      if (rows.some((s) => !s.value.trim() || !s.label.trim())) return 'Each number needs both a value and a label';
      return undefined;
    }
    default:
      return undefined;
  }
}

export function ContentForm({
  type,
  item,
  takenSlugs = [],
}: {
  type: ManagedContentType;
  item?: Values & { id: string };
  takenSlugs?: string[];
}) {
  const config = CONTENT_TYPES[type];
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = Boolean(item);
  const [values, setValues] = useState<Values>(() => initialValues(type, item));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const taken = useMemo(() => new Set(takenSlugs), [takenSlugs]);
  const slugField = config.fields.find((f) => f.kind === 'slug');

  const set = (name: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (slugField && !slugTouched && slugField.slugFrom === name) {
        next[slugField.name] = uniqueSlug(slugify(String(value ?? '')), taken);
      }
      return next;
    });
    if (errors[name]) setErrors(({ [name]: _drop, ...rest }) => rest);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    for (const f of config.fields) {
      const err = validateField(f, values[f.name], taken);
      if (err) found[f.name] = err;
    }
    setErrors(found);
    if (Object.keys(found).length) {
      toast('Please fix the highlighted fields');
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    const payload: Values = {};
    for (const f of config.fields) {
      const v = values[f.name];
      payload[f.name] =
        f.kind === 'number'
          ? Number(v)
          : f.kind === 'points'
            ? ((v as string[]) ?? []).map((s) => s.trim()).filter(Boolean)
            : f.kind === 'stats'
              ? ((v as StatItem[]) ?? [])
                  .map((s) => ({ value: s.value.trim(), label: s.label.trim() }))
                  .filter((s) => s.value || s.label)
              : typeof v === 'string'
                ? v.trim()
                : v;
    }
    setSaving(true);
    const res = isEdit
      ? await api<{ id: string }>('/api/community', { method: 'PUT', body: { type, id: item!.id, updates: payload } })
      : await api<{ id: string }>('/api/community', { method: 'POST', body: { type, item: payload } });
    setSaving(false);
    if (!res.ok) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      toast(res.error ?? 'Could not save');
      return;
    }
    toast(isEdit ? `${config.singular} saved` : `${config.singular} created`);
    router.push(`/content/${type}`);
    router.refresh();
  };

  const remove = async () => {
    if (!item) return;
    setDeleting(true);
    const res = await api(`/api/community?type=${type}&id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    setDeleting(false);
    setConfirmDelete(false);
    if (!res.ok) {
      toast(res.error ?? 'Could not delete');
      return;
    }
    toast(`${config.singular} deleted`);
    router.push(`/content/${type}`);
    router.refresh();
  };

  const renderField = (f: FieldDef) => {
    const common = { label: f.label, hint: f.hint, error: errors[f.name], required: f.required, className: cn(f.full && 'md:col-span-2') };
    const v = values[f.name];
    switch (f.kind) {
      case 'text':
        return <TextField key={f.name} {...common} value={String(v ?? '')} onChange={(x) => set(f.name, x)} placeholder={f.placeholder} maxLength={f.max} />;
      case 'url':
        return <TextField key={f.name} {...common} type="url" value={String(v ?? '')} onChange={(x) => set(f.name, x)} placeholder={f.placeholder ?? 'https://'} />;
      case 'date':
        return <TextField key={f.name} {...common} type="date" value={String(v ?? '')} onChange={(x) => set(f.name, x)} />;
      case 'number':
        return <TextField key={f.name} {...common} type="number" inputMode="numeric" min={f.min} max={f.max} value={String(v ?? '')} onChange={(x) => set(f.name, x)} />;
      case 'slug':
        return (
          <TextField
            key={f.name}
            {...common}
            value={String(v ?? '')}
            onChange={(x) => {
              setSlugTouched(true);
              set(f.name, slugify(x));
            }}
          />
        );
      case 'textarea':
      case 'richtext':
        return (
          <TextAreaField
            key={f.name}
            {...common}
            rows={f.kind === 'richtext' ? 12 : 4}
            value={String(v ?? '')}
            onChange={(x) => set(f.name, x)}
            placeholder={f.placeholder}
            maxLength={f.max}
          />
        );
      case 'select': {
        const opts = (f.options ?? []).map((o) => ({ value: o, label: o }));
        const current = String(v ?? '');
        if (current && !opts.some((o) => o.value === current)) opts.push({ value: current, label: `${current} (current)` });
        return <SelectField key={f.name} {...common} value={current} onChange={(x) => set(f.name, x)} options={opts} placeholder={f.required ? 'Select…' : '—'} />;
      }
      case 'toggle':
        return <Switch key={f.name} className={cn('md:col-span-2')} checked={Boolean(v)} onChange={(x) => set(f.name, x)} label={f.label} description={f.hint} />;
      case 'image':
        return (
          <ImageUpload
            key={f.name}
            label={f.label}
            value={String(v ?? '')}
            onChange={(x) => set(f.name, x)}
            aspect={f.aspect ?? 'banner'}
            error={errors[f.name]}
            className={cn(f.full && 'md:col-span-2')}
          />
        );
      case 'file':
        return (
          <FileUpload
            key={f.name}
            label={f.label}
            hint={f.hint}
            value={String(v ?? '')}
            onChange={(x) => set(f.name, x)}
            error={errors[f.name]}
            className={cn(f.full && 'md:col-span-2')}
          />
        );
      case 'points':
        return (
          <PointsEditor
            key={f.name}
            label={f.label}
            hint={f.hint}
            error={errors[f.name]}
            className={cn(f.full && 'md:col-span-2')}
            value={(v as string[]) ?? []}
            onChange={(x) => set(f.name, x)}
            max={f.max}
          />
        );
      case 'stats':
        return (
          <StatsEditor
            key={f.name}
            label={f.label}
            hint={f.hint}
            error={errors[f.name]}
            className={cn(f.full && 'md:col-span-2')}
            value={(v as StatItem[]) ?? []}
            onChange={(x) => set(f.name, x)}
            max={f.max}
          />
        );
      case 'tags':
      case 'lines':
        return <ListField key={f.name} {...common} mode={f.kind} value={(v as string[]) ?? []} onChange={(x) => set(f.name, x)} />;
      case 'color':
        return (
          <div key={f.name} className="flex items-end gap-3">
            <TextField {...common} className="flex-1" value={String(v ?? '')} onChange={(x) => set(f.name, x)} placeholder="#2F6FE4" />
            <label className="mb-1 grid h-11 w-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-mist/[0.16]">
              <span className="sr-only">Pick {f.label.toLowerCase()}</span>
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(String(v ?? '')) ? String(v) : '#000000'}
                onChange={(e) => set(f.name, e.target.value.toUpperCase())}
                className="h-14 w-14 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
        );
    }
  };

  const toggles = config.fields.filter((f) => f.kind === 'toggle');
  const main = config.fields.filter((f) => f.kind !== 'toggle');

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title={`${config.singular} details`}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{main.map(renderField)}</div>
        </Panel>
        {toggles.length > 0 && (
          <Panel title="Visibility" className="h-fit">
            <div className="flex flex-col gap-3">{toggles.map(renderField)}</div>
          </Panel>
        )}
      </div>

      <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-token-lg border border-mist/[0.12] bg-panel/90 p-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isEdit && config.allowDelete && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-bad">
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="line" size="sm" onClick={() => router.push(`/content/${type}`)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={saving}>
            {!saving && <Save className="h-4 w-4" aria-hidden />}
            {isEdit ? 'Save changes' : `Create ${config.singular.toLowerCase()}`}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete this ${config.singular.toLowerCase()}?`}
        description="It will be removed from the website permanently. To hide it temporarily, switch off “Published” instead."
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </form>
  );
}
