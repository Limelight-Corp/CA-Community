'use client';

import React from 'react';

export type CalendarRange = 'q1' | 'h1' | 'yr';

export interface CalendarPreviewProps {
  range?: CalendarRange;
  className?: string;
}

export const CalendarPreview: React.FC<CalendarPreviewProps> = ({
  range = 'yr',
  className,
}) => {
  const config = {
    q1: { weeks: 13, months: ['Jan', 'Feb', 'Mar', 'Apr'], label: 'Jan – Mar' },
    h1: { weeks: 26, months: ['Jan', 'Mar', 'May', 'Jul'], label: 'Jan – Jun' },
    yr: { weeks: 52, months: ['Jan', 'Apr', 'Jul', 'Oct', 'Dec'], label: 'across 2027' },
  }[range];

  const ev = [0, 0, 0, 0];
  const barElements: React.ReactNode[] = [];

  for (let i = 0; i < config.weeks; i++) {
    const k = (i * 7 + 3) % 11;
    const type = k < 5 ? 0 : k < 7 ? 1 : k < 9 ? 2 : 3;
    const h = type === 3 ? 14 : 28 + ((i * 37) % 9) * 8;
    if (type < 3) {
      ev[type] = (ev[type] ?? 0) + (type === 1 ? 1 : 2);
    }

    const bgGradients = [
      'linear-gradient(180deg,var(--brand-100),var(--brand-300))',
      'linear-gradient(180deg,white,var(--brand-100))',
      'linear-gradient(180deg,var(--brand-300),var(--brand-700))',
      'rgb(var(--mist-rgb)/.12)',
    ];

    barElements.push(
      <span
        key={i}
        className="flex-1 rounded-t-[3px] rounded-b-[1px] min-w-[2px] transition-all duration-400"
        style={{ height: `${h}%`, background: bgGradients[type] }}
      />
    );
  }

  const totalEvents = ev[0]! + ev[1]! + ev[2]!;

  return (
    <div className={className}>
      {/* Stat Header */}
      <div className="flex items-end gap-3.5">
        <b className="font-display font-light text-[48px] md:text-[56px] leading-[0.85] tracking-[-0.05em] text-white">
          {totalEvents}
        </b>
        <span className="text-[13px] leading-[1.35] text-fg-subtle pb-0.5">
          events planned
          <br />
          {config.label}
        </span>
      </div>

      {/* Bar Chart */}
      <div
        className="flex items-end gap-[3px] h-[84px] mt-5.5"
        aria-label={`${config.weeks} weeks of planned events`}
      >
        {barElements}
      </div>

      {/* Month Axis */}
      <div className="flex justify-between font-mono text-[11px] text-muted mt-2.5 pt-2.5 border-t border-[rgb(var(--mist-rgb)/0.1)]">
        {config.months.map((m, idx) => (
          <span key={idx}>{m}</span>
        ))}
      </div>
    </div>
  );
};
