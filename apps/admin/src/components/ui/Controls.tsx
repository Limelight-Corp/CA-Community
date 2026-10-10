'use client';

/**
 * Interactive admin controls: accessible form fields, image upload, confirm dialog, search and
 * filter inputs, export buttons. All labels are wired to their controls through FormField.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileUp, ImagePlus, Link2, Loader2, Search, Trash2, X } from 'lucide-react';
import { Button, FormField, Modal, cn, fieldInputClass } from '@ascend/ui';

/* ------------------------------------------------------------------------------------------ */
/* Text-like fields                                                                            */
/* ------------------------------------------------------------------------------------------ */

interface BaseFieldProps {
  id?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
}

export function TextField({
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  inputMode,
  autoComplete,
  min,
  max,
  step,
  ...base
}: BaseFieldProps & {
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'url' | 'tel' | 'number' | 'date' | 'search';
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const auto = useId();
  return (
    <FormField id={base.id ?? auto} label={base.label} hint={base.hint} error={base.error} required={base.required} className={base.className}>
      {(control) => (
        <input
          {...control}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete ?? 'off'}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldInputClass, 'py-3 text-[14.5px] [color-scheme:dark]')}
        />
      )}
    </FormField>
  );
}

export function TextAreaField({
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength,
  ...base
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  const auto = useId();
  return (
    <FormField id={base.id ?? auto} label={base.label} hint={base.hint} error={base.error} required={base.required} className={base.className}>
      {(control) => (
        <textarea
          {...control}
          rows={rows}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldInputClass, 'resize-y py-3 text-[14.5px] leading-relaxed')}
        />
      )}
    </FormField>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  ...base
}: BaseFieldProps & {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const auto = useId();
  return (
    <FormField id={base.id ?? auto} label={base.label} hint={base.hint} error={base.error} required={base.required} className={base.className}>
      {(control) => (
        <select
          {...control}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(fieldInputClass, 'cursor-pointer py-3 text-[14.5px]')}
        >
          {placeholder !== undefined && (
            <option value="" className="bg-card">
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-card">
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Switch                                                                                      */
/* ------------------------------------------------------------------------------------------ */

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-2xl border border-mist/[0.1] bg-field/60 px-4 py-3',
        className
      )}
    >
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[14px] font-medium text-[var(--fg)]">
          {label}
        </label>
        {description && (
          <span id={`${id}-desc`} className="mt-0.5 block text-[12px] text-[var(--muted)]">
            {description}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300 disabled:opacity-50',
          checked ? 'border-brand-400 bg-brand-500' : 'border-mist/[0.16] bg-mist/[0.08]'
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-fg shadow transition-[left]',
            checked ? 'left-[calc(100%-1.4rem)]' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Tags (comma separated) and line lists                                                       */
/* ------------------------------------------------------------------------------------------ */

export function ListField({
  value,
  onChange,
  mode,
  ...base
}: BaseFieldProps & { value: string[]; onChange: (value: string[]) => void; mode: 'tags' | 'lines' }) {
  const sep = mode === 'tags' ? ', ' : '\n';
  const [text, setText] = useState(() => (value ?? []).join(sep));
  const lastEmitted = useRef<string[]>(value ?? []);

  useEffect(() => {
    // Sync when the value is replaced from outside (e.g. form reset).
    if ((value ?? []).join('\u0000') !== lastEmitted.current.join('\u0000')) {
      setText((value ?? []).join(sep));
      lastEmitted.current = value ?? [];
    }
  }, [value, sep]);

  const handle = (next: string) => {
    setText(next);
    const list = next
      .split(mode === 'tags' ? ',' : /\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    lastEmitted.current = list;
    onChange(list);
  };

  return mode === 'tags' ? (
    <TextField {...base} value={text} onChange={handle} />
  ) : (
    <TextAreaField {...base} rows={6} value={text} onChange={handle} />
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Document upload (or link)                                                                   */
/* ------------------------------------------------------------------------------------------ */

const DOC_MAX = 15 * 1024 * 1024;

/** Uploads a PDF/Office document through /api/upload?type=document, or takes a pasted link. */
export function FileUpload({
  label,
  value,
  onChange,
  hint,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isUploaded = value.startsWith('/resource-files/');
  const fileName = isUploaded ? value.slice('/resource-files/'.length) : '';

  const upload = async (file: File) => {
    setUploadError(null);
    if (file.size > DOC_MAX) {
      setUploadError('The file is larger than 15 MB.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload?type=document', { method: 'POST', body: fd, credentials: 'same-origin' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.url) {
        setUploadError(json?.error || 'Upload failed. Please try again.');
        return;
      }
      onChange(json.url as string);
    } catch {
      setUploadError('Network error while uploading.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const shownError = uploadError ?? error;

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className="text-[13px] font-medium text-[var(--fg)]" id={`${inputId}-label`}>
        {label}
      </span>
      {isUploaded ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mist/[0.16] bg-field/60 px-4 py-3">
          <FileUp className="h-5 w-5 shrink-0 text-brand-200" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--fg)]">Uploaded file · {fileName}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={busy}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Remove
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or upload a file"
            aria-labelledby={`${inputId}-label`}
            className={cn(fieldInputClass, 'pl-9')}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,application/pdf"
          className="sr-only"
          aria-labelledby={`${inputId}-label`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        <Button type="button" variant="line" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileUp className="h-4 w-4" aria-hidden />}
          {busy ? 'Uploading…' : isUploaded ? 'Replace file' : 'Upload file'}
        </Button>
      </div>
      {shownError ? (
        <span role="alert" className="text-[12px] text-bad">
          {shownError}
        </span>
      ) : hint ? (
        <span className="text-[12px] text-[var(--muted)]">{hint}</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Image upload                                                                                */
/* ------------------------------------------------------------------------------------------ */

export function ImageUpload({
  label,
  value,
  onChange,
  aspect = 'banner',
  hint = 'PNG, JPEG, WebP or GIF · up to 5 MB',
  error,
  className,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'banner';
  hint?: string;
  error?: string;
  className?: string;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploadError(null);
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('The file is larger than 5 MB.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'same-origin' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json.url) {
        setUploadError(json?.error || 'Upload failed. Please try again.');
        return;
      }
      onChange(json.url as string);
    } catch {
      setUploadError('Network error while uploading.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const shownError = uploadError ?? error;

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className="text-[13px] font-medium text-[var(--fg)]" id={`${inputId}-label`}>
        {label}
      </span>
      <div className={cn('flex gap-4', aspect === 'square' ? 'items-center' : 'flex-col')}>
        <div
          className={cn(
            'relative grid shrink-0 place-items-center overflow-hidden border border-dashed border-mist/[0.16] bg-field/60',
            aspect === 'square' ? 'h-24 w-24 rounded-full' : 'aspect-[16/7] w-full rounded-2xl'
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-[var(--muted)]" aria-hidden />
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-bg/70">
              <Loader2 className="h-6 w-6 animate-spin text-brand-200" aria-label="Uploading" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            aria-labelledby={`${inputId}-label`}
            aria-describedby={`${inputId}-hint`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <Button type="button" variant="line" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
            <ImagePlus className="h-4 w-4" aria-hidden />
            {value ? 'Replace image' : 'Upload image'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} disabled={busy}>
              <Trash2 className="h-4 w-4" aria-hidden />
              Remove
            </Button>
          )}
        </div>
      </div>
      {shownError ? (
        <span role="alert" className="text-[12px] text-bad">
          {shownError}
        </span>
      ) : (
        <span id={`${inputId}-hint`} className="text-[12px] text-[var(--muted)]">
          {hint}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Confirm dialog                                                                              */
/* ------------------------------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  busy,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal isOpen={open} onClose={busy ? () => undefined : onClose} title={title} description={description} maxWidth="sm">
      {children}
      <div className="mt-2 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <Button type="button" variant="line" size="sm" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onConfirm}
          isLoading={busy}
          autoFocus
          className={danger ? '!bg-none !bg-bad-deep hover:!brightness-110' : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Toolbar inputs                                                                              */
/* ------------------------------------------------------------------------------------------ */

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  label = 'Search',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('relative min-w-0 flex-1 sm:min-w-[220px]', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-mist/[0.12] bg-field/80 py-2.5 pl-10 pr-9 text-[14px] text-[var(--fg)] outline-none transition placeholder:text-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--muted)] hover:text-[var(--fg)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'All',
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  allLabel?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-full border border-mist/[0.12] bg-field/80 py-2.5 pl-4 pr-8 text-[13.5px] text-[var(--fg)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 sm:w-auto"
      >
        <option value="" className="bg-card">
          {label}: {allLabel}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

/** CSV + Excel download links for an export endpoint (filters passed as query params). */
export function ExportButtons({
  dataset,
  params = {},
  label = 'Export',
}: {
  dataset: 'registrations' | 'payments' | 'members';
  params?: Record<string, string | undefined>;
  label?: string;
}) {
  const href = (format: 'csv' | 'xlsx') => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    sp.set('format', format);
    return `/api/export/${dataset}?${sp.toString()}`;
  };
  const cls =
    'inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-mist/[0.16] bg-mist/[0.04] px-3.5 py-2 text-[13px] font-semibold text-[var(--fg)] transition hover:border-brand-300/50 hover:bg-mist/[0.08]';
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <a href={href('csv')} className={cls} download>
        <Download className="h-4 w-4" aria-hidden />
        CSV
      </a>
      <a href={href('xlsx')} className={cls} download>
        <FileSpreadsheet className="h-4 w-4 text-ok" aria-hidden />
        Excel
      </a>
    </div>
  );
}
