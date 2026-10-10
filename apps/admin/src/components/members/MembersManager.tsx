'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, IndianRupee, Pencil, X } from 'lucide-react';
import { MEMBERSHIP_PLANS, ORG_WINGS, membershipFeeFor, membershipState, type CommunityMemberApplication, type SiteSettings } from '@ascend/shared';
import { Avatar, Button, Modal, useToast } from '@ascend/ui';
import { api } from '../../lib/client-api';
import { filterMembers } from '../../lib/filters';
import { MEMBER_STATUS_LABEL, formatDateTime } from '../../lib/format';
import { DataTable, EmptyRow, MemberChip } from '../ui/Display';
import { ConfirmDialog, ExportButtons, FilterSelect, SearchInput, SelectField, TextField, Toolbar } from '../ui/Controls';

const PLAN_OPTIONS = MEMBERSHIP_PLANS.map((p) => ({ value: p.key, label: p.name }));
const STATUS_OPTIONS = Object.entries(MEMBER_STATUS_LABEL).map(([value, label]) => ({ value, label }));
const planName = (key: string) => MEMBERSHIP_PLANS.find((p) => p.key === key)?.name ?? key;

type EditState = Pick<
  CommunityMemberApplication,
  'name' | 'email' | 'mobile' | 'city' | 'plan' | 'status'
> & { membershipNo: string; qualificationYear: string; areaOfPractice: string; organisation: string; linkedinUrl: string };

function toEdit(m: CommunityMemberApplication): EditState {
  return {
    name: m.name,
    email: m.email,
    mobile: m.mobile,
    city: m.city ?? '',
    plan: m.plan,
    status: m.status,
    membershipNo: m.membershipNo ?? '',
    qualificationYear: m.qualificationYear ?? '',
    areaOfPractice: m.areaOfPractice ?? '',
    organisation: m.organisation ?? '',
    linkedinUrl: m.linkedinUrl ?? '',
  };
}

const STATE_CHIP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'border-ok/30 bg-ok/10 text-ok' },
  awaiting_payment: { label: 'Payment due', cls: 'border-gold/30 bg-gold/10 text-gold' },
  expired: { label: 'Expired', cls: 'border-bad/30 bg-bad/10 text-bad' },
};
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function MembersManager({
  rows,
  initial = {},
  fees,
}: {
  rows: CommunityMemberApplication[];
  initial?: { q?: string; plan?: string; status?: string; city?: string };
  /** Current membership fee overrides from Site Settings. */
  fees?: SiteSettings['membershipFees'];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState(initial.q ?? '');
  const [plan, setPlan] = useState(initial.plan ?? '');
  const [status, setStatus] = useState(initial.status ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<CommunityMemberApplication | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState<CommunityMemberApplication | null>(null);
  const [paying, setPaying] = useState<CommunityMemberApplication | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const openPay = (m: CommunityMemberApplication) => {
    const due = membershipState(m) === 'awaiting_payment' && m.membershipFee !== undefined ? m.membershipFee : membershipFeeFor(m.plan, { membershipFees: fees });
    setPayAmount(String(due));
    setPaying(m);
  };
  const recordPayment = async () => {
    if (!paying) return;
    const amount = Number(payAmount);
    if (!Number.isInteger(amount) || amount < 0) {
      toast('Enter the amount received in whole rupees');
      return;
    }
    setBusy(paying.id);
    const res = await api(`/api/members/${encodeURIComponent(paying.id)}/payment`, { method: 'POST', body: { amount } });
    setBusy(null);
    if (!res.ok) {
      toast(res.error ?? 'Could not record the payment');
      return;
    }
    toast(`Payment recorded — ${paying.name} is active for 12 months`);
    setPaying(null);
    router.refresh();
  };

  const cities = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of rows) if (m.city?.trim()) map.set(m.city.trim().toLowerCase(), m.city.trim());
    return [...map.values()].sort((a, b) => a.localeCompare(b)).map((c) => ({ value: c, label: c }));
  }, [rows]);

  const filtered = useMemo(() => filterMembers(rows, { q, plan, status, city }), [rows, q, plan, status, city]);

  const patch = async (m: CommunityMemberApplication, updates: Partial<EditState>, success: string) => {
    setBusy(m.id);
    const res = await api('/api/members', { method: 'PATCH', body: { id: m.id, updates } });
    setBusy(null);
    if (!res.ok) {
      toast(res.error ?? 'Could not update the application');
      return res;
    }
    toast(success);
    router.refresh();
    return res;
  };

  const openEdit = (m: CommunityMemberApplication) => {
    setEditing(m);
    setEdit(toEdit(m));
    setErrors({});
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !edit) return;
    const found: Record<string, string> = {};
    if (!edit.name.trim()) found.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(edit.email.trim())) found.email = 'Enter a valid email';
    if (edit.mobile.trim().length < 6) found.mobile = 'Enter a valid mobile number';
    if (edit.linkedinUrl && !/^https?:\/\/\S+$/i.test(edit.linkedinUrl)) found.linkedinUrl = 'Enter a full URL starting with https://';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const res = await patch(editing, edit, 'Application updated');
    setSaving(false);
    if (res.ok) setEditing(null);
    else if (res.fieldErrors) setErrors(res.fieldErrors);
  };

  const setField = <K extends keyof EditState>(k: K, v: EditState[K]) => setEdit((s) => (s ? { ...s, [k]: v } : s));

  return (
    <div className="flex flex-col gap-5">
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Name, email, mobile, organisation…" label="Search members" />
        <FilterSelect label="Plan" value={plan} onChange={setPlan} options={PLAN_OPTIONS} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterSelect label="City" value={city} onChange={setCity} options={cities} />
        <div className="sm:ml-auto">
          <ExportButtons dataset="members" params={{ q, plan, status, city }} label="Export member database" />
        </div>
      </Toolbar>
      <p className="text-[12.5px] text-[var(--muted)]" aria-live="polite">
        Showing {filtered.length} of {rows.length} applications
      </p>

      <DataTable label="Membership applications">
        <thead>
          <tr>
            <th scope="col">Applicant</th>
            <th scope="col">Plan</th>
            <th scope="col">City</th>
            <th scope="col">Organisation</th>
            <th scope="col">Applied</th>
            <th scope="col">Status</th>
            <th scope="col">Membership</th>
            <th scope="col" className="text-right">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <EmptyRow colSpan={8}>{rows.length === 0 ? 'No membership applications yet.' : 'No applications match these filters.'}</EmptyRow>
          )}
          {filtered.map((m) => (
            <tr key={m.id}>
              <td className="max-w-[260px]">
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} src={m.photoUrl} size={36} />
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-[var(--fg)]">{m.name}</span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">{m.email}</span>
                    <span className="block truncate text-[12px] text-[var(--muted)]">{m.mobile}</span>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap text-[13px]">{planName(m.plan)}</td>
              <td className="text-[13px]">{m.city || '—'}</td>
              <td className="max-w-[180px] truncate text-[13px]">{m.organisation || '—'}</td>
              <td className="whitespace-nowrap text-[12.5px] text-[var(--muted)]">{formatDateTime(m.createdAt)}</td>
              <td>
                <MemberChip status={m.status} />
              </td>
              <td className="whitespace-nowrap">
                {(() => {
                  const st = membershipState(m);
                  const chip = STATE_CHIP[st];
                  if (!chip) return <span className="text-[12px] text-[var(--muted)]">—</span>;
                  return (
                    <>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${chip.cls}`}>{chip.label}</span>
                      {m.validUntil && (
                        <span className="mt-1 block text-[11.5px] text-[var(--muted)]">
                          {st === 'expired' ? 'Expired' : 'Until'} {shortDate(m.validUntil)}
                        </span>
                      )}
                    </>
                  );
                })()}
              </td>
              <td>
                <div className="flex items-center justify-end gap-1.5">
                  {m.status === 'approved' && membershipState(m) !== 'active' && (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => openPay(m)}
                      className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-[12px] font-medium text-gold transition hover:bg-gold/20 disabled:opacity-40"
                      title="Record a payment received outside the website"
                    >
                      <IndianRupee className="h-3.5 w-3.5" aria-hidden />
                      Mark paid
                      <span className="sr-only"> for {m.name}</span>
                    </button>
                  )}
                  {m.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => void patch(m, { status: 'approved' }, `${m.name} approved`)}
                      className="inline-flex items-center gap-1 rounded-full border border-ok/30 bg-ok/10 px-3 py-1.5 text-[12px] font-medium text-ok transition hover:bg-ok/20 disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden />
                      Approve
                      <span className="sr-only"> {m.name}</span>
                    </button>
                  )}
                  {m.status !== 'rejected' && (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => setRejecting(m)}
                      className="inline-flex items-center gap-1 rounded-full border border-bad/30 px-3 py-1.5 text-[12px] font-medium text-bad transition hover:bg-bad/10 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                      Reject
                      <span className="sr-only"> {m.name}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEdit(m)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-mist/[0.12] text-[var(--muted)] hover:text-[var(--fg)]"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    <span className="sr-only">View or edit {m.name}</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>

      <ConfirmDialog
        open={!!paying}
        title="Record an offline payment?"
        description={
          paying
            ? `${paying.name}'s ${planName(paying.plan)} becomes active for 12 months${membershipState(paying) === 'expired' ? ' from today' : ''} and they get a receipt by email. Use 0 for a complimentary membership.`
            : ''
        }
        confirmLabel="Record payment"
        busy={!!paying && busy === paying.id}
        onConfirm={() => void recordPayment()}
        onClose={() => setPaying(null)}
      >
        <TextField label="Amount received (₹)" value={payAmount} onChange={setPayAmount} inputMode="numeric" />
      </ConfirmDialog>

      <ConfirmDialog
        open={rejecting !== null}
        title="Reject this application?"
        description={rejecting ? `${rejecting.name}'s membership application will be marked rejected. You can approve it later if needed.` : undefined}
        confirmLabel="Reject application"
        danger
        busy={rejecting ? busy === rejecting.id : false}
        onClose={() => setRejecting(null)}
        onConfirm={async () => {
          if (!rejecting) return;
          await patch(rejecting, { status: 'rejected' }, 'Application rejected');
          setRejecting(null);
        }}
      />

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.name}
        description={editing ? `Applied ${formatDateTime(editing.createdAt)} · ${planName(editing.plan)}` : undefined}
        maxWidth="lg"
      >
        {editing && edit && (
          <form onSubmit={saveEdit} noValidate className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Full name" required value={edit.name} onChange={(v) => setField('name', v)} error={errors.name} />
              <TextField label="Email" type="email" required value={edit.email} onChange={(v) => setField('email', v)} error={errors.email} />
              <TextField label="Mobile" type="tel" required value={edit.mobile} onChange={(v) => setField('mobile', v)} error={errors.mobile} />
              <TextField label="City" value={edit.city} onChange={(v) => setField('city', v)} error={errors.city} />
              <SelectField label="Plan" value={edit.plan} onChange={(v) => setField('plan', v as EditState['plan'])} options={PLAN_OPTIONS} />
              <SelectField label="Status" value={edit.status} onChange={(v) => setField('status', v as EditState['status'])} options={STATUS_OPTIONS} />
              <TextField label="ICAI membership no." value={edit.membershipNo} onChange={(v) => setField('membershipNo', v)} error={errors.membershipNo} />
              <TextField label="Qualification year" value={edit.qualificationYear} onChange={(v) => setField('qualificationYear', v)} error={errors.qualificationYear} />
              <TextField label="Area of practice" value={edit.areaOfPractice} onChange={(v) => setField('areaOfPractice', v)} error={errors.areaOfPractice} />
              <TextField label="Organisation" value={edit.organisation} onChange={(v) => setField('organisation', v)} error={errors.organisation} />
              <TextField label="LinkedIn" type="url" value={edit.linkedinUrl} onChange={(v) => setField('linkedinUrl', v)} error={errors.linkedinUrl} className="sm:col-span-2" />
            </div>
            {editing.interests && editing.interests.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)]">Wing interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {editing.interests.map((n) => (
                    <span key={n} className="rounded-full border border-brand-300/25 bg-brand-500/10 px-2.5 py-1 text-[12px] text-brand-100">
                      {ORG_WINGS.find((w) => w.number === n)?.name ?? `Wing ${n}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button type="button" variant="line" size="sm" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
