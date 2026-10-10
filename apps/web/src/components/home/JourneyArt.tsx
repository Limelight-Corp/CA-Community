import React from 'react';

/**
 * Animated illustrations for the nine member-journey steps. Pure inline SVG with CSS motion
 * (`.jr-*` classes in tokens.css), so they stay crisp, themeable and cost no network requests.
 */

const GOLD = 'rgb(var(--gold-rgb))';
const BLUE = 'var(--brand-300)';
const LIME = 'rgb(var(--lime-rgb))';
const LINE = 'rgb(var(--mist-rgb) / 0.16)';
const SOFT = 'rgb(var(--mist-rgb) / 0.08)';
const INK = 'rgb(var(--mist-rgb) / 0.55)';

const d = (s: number): React.CSSProperties => ({ animationDelay: `${s}s` });

function Discover() {
  return (
    <>
      {[46, 34, 22].map((r) => (
        <circle key={r} cx="120" cy="64" r={r} fill="none" stroke={LINE} />
      ))}
      <line x1="74" y1="64" x2="166" y2="64" stroke={SOFT} />
      <line x1="120" y1="18" x2="120" y2="110" stroke={SOFT} />
      <g className="jr-spin">
        <circle cx="120" cy="64" r="46" fill="none" />
        <path d="M120 64 L120 18 A46 46 0 0 1 160 41 Z" fill="url(#jr-sweep)" />
      </g>
      <circle className="jr-blip" style={d(0.2)} cx="142" cy="40" r="4" fill={GOLD} />
      <circle className="jr-blip" style={d(1)} cx="96" cy="80" r="3.5" fill={BLUE} />
      <circle className="jr-blip" style={d(1.7)} cx="150" cy="86" r="3" fill={LIME} />
      <circle cx="120" cy="64" r="3" fill={GOLD} />
      <defs>
        <linearGradient id="jr-sweep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.55" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </linearGradient>
      </defs>
    </>
  );
}

function Register() {
  return (
    <>
      <rect x="62" y="14" width="116" height="100" rx="12" fill={SOFT} stroke={LINE} />
      <circle cx="80" cy="30" r="5" fill={BLUE} />
      <rect x="90" y="27" width="40" height="6" rx="3" fill={INK} opacity="0.5" />
      {[46, 64, 82].map((y, i) => (
        <g key={y}>
          <rect x="74" y={y} width="92" height="12" rx="6" fill="none" stroke={LINE} />
          <rect className="jr-fill" style={d(i * 0.45)} x="78" y={y + 4} width={[56, 70, 44][i]} height="4" rx="2" fill={i === 2 ? GOLD : BLUE} />
        </g>
      ))}
      <rect className="jr-blink" x="168" y="84" width="1.5" height="8" fill={INK} />
      <g className="jr-pop">
        <circle cx="166" cy="104" r="11" fill={LIME} />
        <path d="M161 104 l4 4 l7 -8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

function Member() {
  return (
    <>
      <g className="jr-float">
        <clipPath id="jr-card">
          <rect x="58" y="22" width="124" height="80" rx="12" />
        </clipPath>
        <rect x="58" y="22" width="124" height="80" rx="12" fill="url(#jr-card-g)" />
        <g clipPath="url(#jr-card)">
          <rect className="jr-sheen" x="58" y="10" width="26" height="110" fill="#fff" opacity="0.22" />
        </g>
        <rect x="70" y="36" width="20" height="15" rx="3" fill={GOLD} opacity="0.9" />
        <rect x="70" y="72" width="60" height="5" rx="2.5" fill="#fff" opacity="0.75" />
        <rect x="70" y="83" width="38" height="4" rx="2" fill="#fff" opacity="0.45" />
        <circle className="jr-beat" cx="160" cy="44" r="10" fill={GOLD} />
        <path d="M160 38 l1.9 3.9 4.3 .6 -3.1 3 .7 4.3 -3.8 -2 -3.8 2 .7 -4.3 -3.1 -3 4.3 -.6z" fill="#fff" />
      </g>
      <defs>
        <linearGradient id="jr-card-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-400)" />
          <stop offset="1" stopColor="var(--brand-800)" />
        </linearGradient>
      </defs>
    </>
  );
}

function Profile() {
  return (
    <>
      <rect x="54" y="16" width="132" height="96" rx="14" fill={SOFT} stroke={LINE} />
      <circle cx="88" cy="52" r="20" fill="none" stroke={BLUE} strokeWidth="2" className="jr-dash" />
      <circle cx="88" cy="47" r="7" fill={BLUE} />
      <path d="M76 64 a12 10 0 0 1 24 0" fill={BLUE} />
      {[38, 50, 62].map((y, i) => (
        <rect key={y} className="jr-fill" style={d(i * 0.4)} x="118" y={y} width={[52, 40, 46][i]} height="6" rx="3" fill={i === 0 ? INK : LINE} />
      ))}
      <g className="jr-pop" style={d(0.3)}>
        <rect x="66" y="86" width="40" height="12" rx="6" fill={GOLD} opacity="0.9" />
        <rect x="112" y="86" width="56" height="12" rx="6" fill={BLUE} opacity="0.6" />
      </g>
    </>
  );
}

function Interests() {
  const chips: [number, number, number][] = [
    [52, 28, 54], [112, 28, 40], [158, 28, 32],
    [52, 56, 36], [94, 56, 56], [156, 56, 34],
    [70, 84, 46], [122, 84, 50],
  ];
  const tones = [GOLD, BLUE, LIME];
  return (
    <>
      {chips.map(([x, y, w], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height="18" rx="9" fill="none" stroke={LINE} />
          <rect className="jr-toggle" style={d((i * 0.6) % 4.8)} x={x} y={y} width={w} height="18" rx="9" fill={tones[i % 3]} opacity="0.18" />
          <rect x={x + 9} y={y + 7} width={w - 18} height="4" rx="2" fill={INK} opacity="0.6" />
        </g>
      ))}
    </>
  );
}

function Events() {
  return (
    <>
      <rect x="50" y="18" width="78" height="86" rx="10" fill={SOFT} stroke={LINE} />
      <rect x="50" y="18" width="78" height="18" rx="10" fill={BLUE} opacity="0.55" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={58 + (i % 4) * 16} y={44 + Math.floor(i / 4) * 18} width="10" height="10" rx="2.5" fill={i === 6 ? GOLD : LINE} className={i === 6 ? 'jr-beat' : undefined} />
      ))}
      <g className="jr-float" style={d(0.4)}>
        <path d="M118 52 h66 a6 6 0 0 1 6 6 v6 a7 7 0 0 0 0 14 v6 a6 6 0 0 1 -6 6 h-66 a6 6 0 0 1 -6 -6 v-6 a7 7 0 0 0 0 -14 v-6 a6 6 0 0 1 6 -6z" fill="url(#jr-ticket)" />
        <line x1="166" y1="56" x2="166" y2="88" stroke="#fff" strokeOpacity="0.45" strokeDasharray="3 3" />
        <rect x="124" y="62" width="34" height="5" rx="2.5" fill="#fff" opacity="0.85" />
        <rect x="124" y="73" width="24" height="4" rx="2" fill="#fff" opacity="0.5" />
        <circle cx="178" cy="72" r="4" fill={GOLD} />
      </g>
      <defs>
        <linearGradient id="jr-ticket" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-400)" />
          <stop offset="1" stopColor="var(--brand-700)" />
        </linearGradient>
      </defs>
    </>
  );
}

function NetworkArt() {
  const nodes: [number, number, string][] = [
    [120, 64, GOLD], [70, 34, BLUE], [172, 30, LIME], [62, 96, LIME], [178, 96, BLUE], [120, 18, BLUE], [120, 112, GOLD],
  ];
  return (
    <>
      {nodes.slice(1).map(([x, y], i) => (
        <line key={i} x1="120" y1="64" x2={x} y2={y} stroke={LINE} strokeWidth="1.5" className="jr-dash" style={d(i * 0.2)} />
      ))}
      <line x1="70" y1="34" x2="120" y2="18" stroke={SOFT} />
      <line x1="172" y1="30" x2="178" y2="96" stroke={SOFT} />
      <line x1="62" y1="96" x2="120" y2="112" stroke={SOFT} />
      {nodes.map(([x, y, c], i) => (
        <g key={i}>
          <circle className="jr-blip" style={d(i * 0.35)} cx={x} cy={y} r={i === 0 ? 14 : 9} fill={c} opacity="0.35" />
          <circle cx={x} cy={y} r={i === 0 ? 9 : 5.5} fill={c} />
        </g>
      ))}
    </>
  );
}

function Contribute() {
  return (
    <>
      <g className="jr-orbit">
        <circle cx="120" cy="66" r="40" fill="none" stroke={LINE} strokeDasharray="2 6" />
        <circle cx="160" cy="66" r="4" fill={BLUE} />
        <circle cx="80" cy="66" r="3" fill={LIME} />
      </g>
      <path
        className="jr-beat"
        d="M120 86 c-22 -14 -30 -24 -30 -34 a14 14 0 0 1 30 -6 a14 14 0 0 1 30 6 c0 10 -8 20 -30 34z"
        fill={GOLD}
      />
      {([[96, 40, 0], [146, 34, 0.9], [134, 92, 1.8], [100, 96, 1.3]] as const).map(([x, y, t], i) => (
        <path key={i} className="jr-rise" style={d(t)} d={`M${x} ${y} h8 M${x + 4} ${y - 4} v8`} stroke={i % 2 ? BLUE : GOLD} strokeWidth="2" strokeLinecap="round" />
      ))}
    </>
  );
}

function Leader() {
  const bars = [
    [72, 70, BLUE], [96, 54, BLUE], [120, 38, LIME], [144, 22, GOLD],
  ] as const;
  return (
    <>
      <line x1="60" y1="110" x2="180" y2="110" stroke={LINE} />
      {bars.map(([x, y, c], i) => (
        <rect key={x} className="jr-grow" style={d(i * 0.25)} x={x} y={y + 16} width="18" height={94 - y} rx="4" fill={c} opacity={0.55 + i * 0.15} />
      ))}
      <line x1="153" y1="36" x2="153" y2="8" stroke={INK} strokeWidth="1.5" />
      <path className="jr-wave" d="M154 9 h22 l-6 6 l6 6 h-22z" fill={GOLD} />
      <circle className="jr-blip" cx="153" cy="34" r="8" fill={GOLD} opacity="0.4" />
    </>
  );
}

const ART = [Discover, Register, Member, Profile, Interests, Events, NetworkArt, Contribute, Leader];

export function JourneyArt({ index, className }: { index: number; className?: string }) {
  const Art = ART[index] ?? Discover;
  return (
    <svg viewBox="0 0 240 128" className={['jr-art', className].filter(Boolean).join(' ')} aria-hidden focusable="false">
      <Art />
    </svg>
  );
}
