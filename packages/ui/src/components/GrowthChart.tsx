'use client';

import React from 'react';

export type ChartRange = 'oct' | 'nov' | 'dec' | 'all';

export interface GrowthChartProps {
  range?: ChartRange;
  isNarrow?: boolean;
  className?: string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({
  range = 'all',
  isNarrow = false,
  className,
}) => {
  const start = new Date('2026-10-01');
  const days = 92;
  const W = isNarrow ? 360 : 1200;
  const H = isNarrow ? 250 : 300;
  const pl = 0;
  const pr = isNarrow ? 34 : 56;
  const pt = 10;
  const pb = 28;
  const cw = W - pl - pr;
  const ch = H - pt - pb;
  const ymax = 600;

  const mem: number[] = [];
  const com: number[] = [];

  for (let i = 0; i <= days; i++) {
    const t = i / days;
    const base =
      t < 0.35
        ? (20 * t) / 0.35
        : t < 0.67
        ? 20 + 230 * Math.pow((t - 0.35) / 0.32, 1.2)
        : 250 + 260 * Math.pow((t - 0.67) / 0.33, 0.9);
    const wob = Math.sin(i * 0.9) * 6 + Math.sin(i * 0.37) * 9;
    mem.push(Math.max(0, base + (i > 2 ? wob : 0)));
    com.push(Math.min(112, 120 * (1 - Math.exp(-t * 3.2)) + Math.sin(i * 0.5) * 3));
  }

  const rangeBounds: Record<ChartRange, [number, number]> = {
    oct: [0, 30],
    nov: [31, 60],
    dec: [61, 92],
    all: [0, 92],
  };

  const [r0, r1] = rangeBounds[range];
  const n = r1 - r0;
  const X = (i: number) => pl + ((i - r0) / n) * cw;
  const Y = (v: number) => pt + ch - (v / ymax) * ch;

  const seg = (a: number[]) =>
    a
      .slice(r0, r1 + 1)
      .map((v, k) => `${k ? 'L' : 'M'}${X(r0 + k).toFixed(1)} ${Y(v).toFixed(1)}`)
      .join('');

  const bw = Math.max(isNarrow ? 1.2 : 2, (cw / n) * 0.45);
  const bars: React.ReactNode[] = [];
  for (let i = r0; i <= r1; i++) {
    const v = i ? Math.max(0, (mem[i] || 0) - (mem[i - 1] || 0)) : 0;
    const h = Math.min(ch * 0.28, v * 6 + 6);
    bars.push(
      <rect
        key={i}
        x={(X(i) - bw / 2).toFixed(1)}
        y={(pt + ch - h).toFixed(1)}
        width={bw.toFixed(1)}
        height={h.toFixed(1)}
        className="fill-mist/[0.12]"
      />
    );
  }

  const gridLines: React.ReactNode[] = [];
  for (let v = 100; v <= 600; v += 100) {
    gridLines.push(
      <g key={v}>
        <line
          x1={pl}
          x2={cw}
          y1={Y(v)}
          y2={Y(v)}
          className="stroke-mist/[0.06]"
        />
        <text
          x={W - 4}
          y={Y(v) + 4}
          textAnchor="end"
          className="font-mono text-[11px] fill-[var(--muted)]"
        >
          {v}
        </text>
      </g>
    );
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels: React.ReactNode[] = [];
  const step = Math.max(1, Math.round(n / (isNarrow ? 3 : 8)));
  for (let i = r0; i <= r1; i += step) {
    const d = new Date(start.getTime() + i * 864e5);
    labels.push(
      <text
        key={i}
        x={X(i)}
        y={H - 6}
        textAnchor="middle"
        className="font-mono text-[11px] fill-[var(--muted)]"
      >
        {months[d.getMonth()]} {d.getDate()}
      </text>
    );
  }

  const ex = X(r1);
  const lastMem = mem[r1] || 0;
  const ey = Y(lastMem);
  const endV = Math.round(lastMem);
  const area = `${seg(mem)}L${ex} ${pt + ch}L${X(r0)} ${pt + ch}Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className || 'w-full h-auto block overflow-visible'}
      role="img"
      aria-label="Planned member growth from October to December 2026"
    >
      <defs>
        <linearGradient id="growthAreaGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--brand-500)' }} stopOpacity="0.45" />
          <stop offset="1" style={{ stopColor: 'var(--brand-500)' }} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines}
      {bars}
      <path d={area} fill="url(#growthAreaGrad)" />
      <path
        d={seg(com)}
        fill="none"
        className="stroke-mist"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />
      <path
        d={seg(mem)}
        fill="none"
        className="stroke-brand-300"
        strokeWidth="2.2"
        style={{ filter: 'drop-shadow(0 0 6px rgb(var(--lime-rgb) / 0.9))' }}
      />
      <line
        x1={0}
        x2={cw}
        y1={ey}
        y2={ey}
        className="stroke-mist"
        strokeDasharray="2 4"
        strokeOpacity="0.3"
      />
      <line
        x1={ex}
        x2={ex}
        y1={ey}
        y2={pt + ch}
        className="stroke-mist"
        strokeWidth="1.5"
      />
      <rect
        x={ex - 7}
        y={ey - 7}
        width={14}
        height={14}
        transform={`rotate(45 ${ex} ${ey})`}
        className="fill-white"
      />
      <circle cx={ex} cy={ey} r={2} className="fill-brand-700" />

      {/* Target Bubble */}
      <g transform={`translate(${ex - (isNarrow ? 112 : 124)} ${ey - 14})`}>
        <rect width={isNarrow ? 100 : 110} height={28} rx={14} className="fill-white" />
        <circle cx={14} cy={14} r={4} className="fill-brand-500" />
        <text
          x={26}
          y={18.5}
          className="font-sans text-[12px] font-medium fill-brand-900"
        >
          {endV} members
        </text>
      </g>

      {labels}
    </svg>
  );
};
