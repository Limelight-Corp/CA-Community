'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heading,
  Eyebrow,
  Button,
  Input,
  Badge,
  Modal,
  AscendLogoMark,
  BackIcon,
} from '@ascend/ui';
import { DEFAULT_DARK_TOKENS, APPROVED_FONTS } from '@ascend/shared';

export default function AdminThemeStudioPage() {
  const router = useRouter();

  // State for tokens
  const [tokens, setTokens] = useState({
    bg: DEFAULT_DARK_TOKENS.bg,
    card: DEFAULT_DARK_TOKENS.card,
    fg: DEFAULT_DARK_TOKENS.fg,
    muted: DEFAULT_DARK_TOKENS.muted,
    lime: DEFAULT_DARK_TOKENS.lime,
    limeInk: DEFAULT_DARK_TOKENS.limeInk,
    line: DEFAULT_DARK_TOKENS.line,
    radius: DEFAULT_DARK_TOKENS.radius,
  });

  const [fontDisplay, setFontDisplay] = useState('Inter Tight');

  const [activeVersion, setActiveVersion] = useState(3);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Version history
  const [history, setHistory] = useState([
    { version: 3, date: '04 Nov 2026, 14:30', author: 'Super Admin', status: 'Published' },
    { version: 2, date: '28 Oct 2026, 10:15', author: 'Super Admin', status: 'Archived' },
    { version: 1, date: '15 Oct 2026, 09:00', author: 'Super Admin', status: 'Archived' },
  ]);

  // Relative luminance and contrast ratio computation
  const contrastAudit = useMemo(() => {
    const parseRgb = (color: string): [number, number, number] => {
      let hex = color.trim().toLowerCase();
      if (hex.startsWith('#')) hex = hex.slice(1);
      if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
      if (hex.length >= 6) {
        const num = parseInt(hex.slice(0, 6), 16);
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }
      return [0, 0, 0];
    };

    const getLum = (r: number, g: number, b: number): number => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return (a[0] || 0) * 0.2126 + (a[1] || 0) * 0.7152 + (a[2] || 0) * 0.0722;
    };

    const calcRatio = (c1: string, c2: string) => {
      const rgb1 = parseRgb(c1);
      const rgb2 = parseRgb(c2);
      const l1 = getLum(rgb1[0], rgb1[1], rgb1[2]);
      const l2 = getLum(rgb2[0], rgb2[1], rgb2[2]);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      return Math.round(ratio * 10) / 10;
    };

    const pairs = [
      {
        label: 'Foreground on Background',
        color1: tokens.fg,
        color2: tokens.bg,
        ratio: calcRatio(tokens.fg, tokens.bg),
      },
      {
        label: 'Foreground on Card',
        color1: tokens.fg,
        color2: tokens.card,
        ratio: calcRatio(tokens.fg, tokens.card),
      },
      {
        label: 'Button Text on Primary Button',
        color1: tokens.limeInk,
        color2: tokens.lime,
        ratio: calcRatio(tokens.limeInk, tokens.lime),
      },
      {
        label: 'Muted text on Card',
        color1: tokens.muted,
        color2: tokens.card,
        ratio: calcRatio(tokens.muted, tokens.card),
      },
      {
        label: 'Primary Accent on Background',
        color1: tokens.lime,
        color2: tokens.bg,
        ratio: calcRatio(tokens.lime, tokens.bg),
      },
    ];

    const allAA = pairs.every((p) => p.ratio >= 4.5 || (p.label.includes('Accent') && p.ratio >= 3.0));
    const allAAA = pairs.every((p) => p.ratio >= 7.0);

    return {
      pairs,
      grade: allAAA ? 'AAA' : allAA ? 'AA' : 'FAIL',
    };
  }, [tokens]);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sudoPassword) {
      alert('Sudo authentication password required');
      return;
    }

    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublishModalOpen(false);
      const newVersion = activeVersion + 1;
      setActiveVersion(newVersion);
      setHistory([
        { version: newVersion, date: 'Just now', author: 'Super Admin', status: 'Published' },
        ...history.map((h) => ({ ...h, status: 'Archived' })),
      ]);
      setSudoPassword('');
      setNotification(`Theme version ${newVersion} successfully published to web and mobile PWA.`);
      setTimeout(() => setNotification(null), 4000);
    }, 1000);
  };

  const handleRollback = (ver: number) => {
    if (confirm(`Roll back theme to Version ${ver}?`)) {
      setActiveVersion(ver);
      setTokens({
        bg: DEFAULT_DARK_TOKENS.bg,
        card: DEFAULT_DARK_TOKENS.card,
        fg: DEFAULT_DARK_TOKENS.fg,
        muted: DEFAULT_DARK_TOKENS.muted,
        lime: DEFAULT_DARK_TOKENS.lime,
        limeInk: DEFAULT_DARK_TOKENS.limeInk,
        line: DEFAULT_DARK_TOKENS.line,
        radius: DEFAULT_DARK_TOKENS.radius,
      });
      setNotification(`Theme rolled back to Version ${ver}`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      {/* Admin Top Header */}
      <header className="border-b border-[var(--line)] bg-[rgb(var(--ink-rgb)/0.8)] backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white">
              <AscendLogoMark size={18} />
            </span>
            <div className="flex items-center gap-2">
              <b className="font-display font-semibold text-[15px] tracking-wider text-white">
                ASCEND
              </b>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--card)] text-[var(--muted)] border border-[var(--line)]">
                Theme Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-white bg-transparent border-0 cursor-pointer"
            >
              <BackIcon size={14} /> Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Viewport */}
      <main className="max-w-[1400px] mx-auto w-full px-6 py-10 flex-1">
        {notification && (
          <div className="mb-6 p-4 rounded-[var(--r)] bg-[rgb(var(--teal-rgb)/0.2)] border border-[var(--teal)] text-[var(--teal)] font-medium text-[14px]">
            {notification}
          </div>
        )}

        <div className="flex justify-between items-end gap-4 flex-wrap mb-10">
          <div>
            <Eyebrow>Theme Administration</Eyebrow>
            <Heading level="h1" className="text-[34px] md:text-[40px] mt-2">
              Visual Token Studio
            </Heading>
            <p className="text-[14.5px] text-[var(--muted)] mt-1">
              Active Production Version: <strong className="text-[var(--accent)] font-mono">v{activeVersion}</strong> · Platform: Web & Mobile PWA
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setTokens({
                  bg: DEFAULT_DARK_TOKENS.bg,
                  card: DEFAULT_DARK_TOKENS.card,
                  fg: DEFAULT_DARK_TOKENS.fg,
                  muted: DEFAULT_DARK_TOKENS.muted,
                  lime: DEFAULT_DARK_TOKENS.lime,
                  limeInk: DEFAULT_DARK_TOKENS.limeInk,
                  line: DEFAULT_DARK_TOKENS.line,
                  radius: DEFAULT_DARK_TOKENS.radius,
                });
                setNotification('Tokens reset to prototype defaults');
                setTimeout(() => setNotification(null), 3000);
              }}
            >
              Reset to Defaults
            </Button>

            <Button
              variant="primary"
              onClick={() => setIsPublishModalOpen(true)}
            >
              Publish Theme (Sudo) →
            </Button>
          </div>
        </div>

        {/* 3 Column Grid: Token Inputs, WCAG Matrix, Live Preview Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Token Controls (4 cols) */}
          <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-6 flex flex-col gap-6">
            <h2 className="font-display text-[18px] font-medium text-[var(--fg)] border-b border-[var(--line)] pb-3">
              Design Tokens
            </h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="flex justify-between text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  <span>Background Color (bg)</span>
                  <span className="text-[var(--fg)]">{tokens.bg}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tokens.bg}
                    onChange={(e) => setTokens({ ...tokens, bg: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0.5"
                  />
                  <Input
                    value={tokens.bg}
                    onChange={(e) => setTokens({ ...tokens, bg: e.target.value })}
                    className="font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="flex justify-between text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  <span>Card / Surface Color (card)</span>
                  <span className="text-[var(--fg)]">{tokens.card}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tokens.card}
                    onChange={(e) => setTokens({ ...tokens, card: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0.5"
                  />
                  <Input
                    value={tokens.card}
                    onChange={(e) => setTokens({ ...tokens, card: e.target.value })}
                    className="font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="flex justify-between text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  <span>Foreground Text (fg)</span>
                  <span className="text-[var(--fg)]">{tokens.fg}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tokens.fg}
                    onChange={(e) => setTokens({ ...tokens, fg: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0.5"
                  />
                  <Input
                    value={tokens.fg}
                    onChange={(e) => setTokens({ ...tokens, fg: e.target.value })}
                    className="font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="flex justify-between text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  <span>Primary Accent (lime / accent)</span>
                  <span className="text-[var(--fg)]">{tokens.lime}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tokens.lime}
                    onChange={(e) => setTokens({ ...tokens, lime: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0.5"
                  />
                  <Input
                    value={tokens.lime}
                    onChange={(e) => setTokens({ ...tokens, lime: e.target.value })}
                    className="font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="flex justify-between text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  <span>Muted Text Color (muted)</span>
                  <span className="text-[var(--fg)]">{tokens.muted}</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={tokens.muted}
                    onChange={(e) => setTokens({ ...tokens, muted: e.target.value })}
                    className="w-10 h-10 rounded border border-[var(--line)] bg-transparent cursor-pointer p-0.5"
                  />
                  <Input
                    value={tokens.muted}
                    onChange={(e) => setTokens({ ...tokens, muted: e.target.value })}
                    className="font-mono text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  Border Radius (radius)
                </label>
                <Input
                  value={tokens.radius}
                  onChange={(e) => setTokens({ ...tokens, radius: e.target.value })}
                  placeholder="20px"
                  className="font-mono text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-mono text-[var(--muted)] mb-1">
                  Display Font Family
                </label>
                <select
                  value={fontDisplay}
                  onChange={(e) => setFontDisplay(e.target.value)}
                  className="w-full bg-[var(--surface-muted)] text-[var(--fg)] border border-[var(--line)] rounded-[var(--r)] px-3 py-2 text-[13.5px] outline-none"
                >
                  {APPROVED_FONTS.display.map((f) => (
                    <option key={f} value={f} className="bg-[var(--card)]">{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Column 2: WCAG 2.1 Audit & Version History (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Contrast Card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-6 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[var(--line)] pb-3">
                <h2 className="font-display text-[18px] font-medium text-[var(--fg)]">
                  WCAG 2.1 Audit
                </h2>
                <Badge variant={contrastAudit.grade === 'AAA' ? 'purple' : contrastAudit.grade === 'AA' ? 'green' : 'red'}>
                  {contrastAudit.grade} Compliant
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {contrastAudit.pairs.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[var(--r)] bg-[var(--surface-muted)] border border-[var(--line)] flex justify-between items-center text-[13px]"
                  >
                    <div>
                      <span className="block font-medium text-[var(--fg)]">{p.label}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.color1 }} />
                        <span className="text-[11px] font-mono text-[var(--muted)]">on</span>
                        <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.color2 }} />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-mono font-bold text-[15px] ${p.ratio >= 4.5 ? 'text-[var(--ok)]' : p.ratio >= 3.0 ? 'text-[var(--warn)]' : 'text-[var(--bad)]'}`}>
                        {p.ratio}:1
                      </span>
                      <span className="block text-[10.5px] font-mono text-[var(--muted)]">
                        {p.ratio >= 7.0 ? 'AAA Pass' : p.ratio >= 4.5 ? 'AA Pass' : p.ratio >= 3.0 ? 'Large Pass' : 'Fail'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Version History Card */}
            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-6 flex flex-col gap-4">
              <h2 className="font-display text-[18px] font-medium text-[var(--fg)] border-b border-[var(--line)] pb-3">
                Version History
              </h2>

              <div className="flex flex-col gap-3">
                {history.map((h) => (
                  <div
                    key={h.version}
                    className="p-3 rounded-[var(--r)] bg-[var(--surface-muted)] border border-[var(--line)] flex justify-between items-center text-[13px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[var(--fg)]">v{h.version}</span>
                        <Badge variant={h.status === 'Published' ? 'green' : 'neutral'}>
                          {h.status}
                        </Badge>
                      </div>
                      <span className="text-[11.5px] text-[var(--muted)] mt-0.5 block">
                        {h.date} · {h.author}
                      </span>
                    </div>

                    {h.status !== 'Published' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRollback(h.version)}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Live Component Sandbox (4 cols) */}
          <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r)] p-6 flex flex-col gap-6">
            <h2 className="font-display text-[18px] font-medium text-[var(--fg)] border-b border-[var(--line)] pb-3">
              Live Preview Sandbox
            </h2>

            {/* Injected Preview Wrapper with dynamic styles */}
            <div
              className="p-6 rounded-[var(--r)] flex flex-col gap-5 border transition-all duration-300"
              style={{
                backgroundColor: tokens.bg,
                color: tokens.fg,
                borderColor: tokens.line,
                borderRadius: tokens.radius,
              }}
            >
              <div>
                <span
                  className="text-[11px] font-mono uppercase tracking-wider block mb-1"
                  style={{ color: tokens.muted }}
                >
                  Live Theme Rendering
                </span>
                <h3
                  className="text-[20px] font-medium leading-snug"
                  style={{ color: tokens.fg, fontFamily: fontDisplay }}
                >
                  ASCEND Launch Summit 2027
                </h3>
                <p className="text-[13px] mt-1" style={{ color: tokens.muted }}>
                  01 Jan 2027 · Bharat Mandapam, New Delhi
                </p>
              </div>

              {/* Sample Card */}
              <div
                className="p-4 border flex flex-col gap-2"
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.line,
                  borderRadius: tokens.radius,
                }}
              >
                <div className="flex justify-between items-center text-[12px]">
                  <span style={{ color: tokens.muted }}>Standard Pass</span>
                  <span className="font-mono font-semibold" style={{ color: tokens.fg }}>₹1,499</span>
                </div>
                <div className="flex justify-between items-center text-[12px]">
                  <span style={{ color: tokens.lime }}>Member Privilege</span>
                  <span className="font-mono font-semibold" style={{ color: tokens.lime }}>₹999</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 font-medium text-[14px] cursor-pointer shadow-md transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: tokens.lime,
                    color: tokens.limeInk,
                    borderRadius: tokens.radius,
                    border: 'none',
                  }}
                >
                  Register Now (Primary)
                </button>

                <button
                  type="button"
                  className="w-full py-2.5 px-4 font-medium text-[14px] cursor-pointer border transition-colors"
                  style={{
                    backgroundColor: tokens.card,
                    color: tokens.fg,
                    borderColor: tokens.line,
                    borderRadius: tokens.radius,
                  }}
                >
                  Session Details (Secondary)
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sudo Authentication Modal for Publishing */}
      {isPublishModalOpen && (
        <Modal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          title="Sudo Authentication Required"
          maxWidth="sm"
        >
          <form onSubmit={handlePublish} className="flex flex-col gap-5">
            <p className="text-[14px] text-[var(--muted)] leading-relaxed">
              Publishing theme tokens alters the live visual styles across the entire Pan-India platform and installable PWA. Re-authenticate to confirm.
            </p>

            <div>
              <label className="block text-[13px] font-medium text-[var(--fg)] mb-2">
                Administrator Password / Sudo Key
              </label>
              <Input
                type="password"
                placeholder="Enter your admin password"
                value={sudoPassword}
                onChange={(e) => setSudoPassword(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isPublishing}
              >
                {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
