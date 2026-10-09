/**
 * Shared Tailwind preset. Every colour maps to a CSS variable from
 * packages/ui/src/styles/tokens.css — never to a literal — so theme changes propagate.
 *
 * Colours declared with `rgb(var(--x-rgb) / <alpha-value>)` support opacity modifiers,
 * e.g. `bg-brand-500/15`, `border-mist/[0.12]`.
 */

/** Colour backed by a `--<name>-rgb` channel token (supports `/opacity`). */
const channel = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: channel('bg'),
        card: channel('card'),
        fg: {
          DEFAULT: channel('fg'),
          soft: channel('fg-soft'),
          subtle: channel('fg-subtle'),
        },
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: {
          DEFAULT: 'var(--line)',
          'solid-1': channel('line-solid-1'),
          'solid-2': channel('line-solid-2'),
          'solid-3': channel('line-solid-3'),
          hover: channel('line-hover'),
        },
        soft: channel('soft'),
        ink: {
          DEFAULT: channel('ink'),
          2: 'var(--ink-2)',
        },
        lime: {
          DEFAULT: channel('lime'),
          ink: 'var(--lime-ink)',
          deep: 'var(--lime-deep)',
        },
        sky: channel('sky'),
        cobalt: channel('cobalt'),
        navy: channel('navy'),
        mist: channel('mist'),
        brand: {
          100: channel('brand-100'),
          200: channel('sky'),
          300: channel('brand-300'),
          400: channel('brand-400'),
          450: channel('brand-450'),
          500: channel('lime'),
          600: channel('brand-600'),
          650: channel('brand-650'),
          700: channel('cobalt'),
          800: channel('brand-800'),
          900: channel('navy'),
          950: channel('ink'),
        },
        surface: {
          hi: channel('surface-hi'),
          lo: channel('surface-lo'),
        },
        field: channel('field'),
        panel: channel('panel'),
        gold: {
          DEFAULT: channel('gold'),
          deep: channel('gold-deep'),
          soft: channel('gold-soft'),
        },
        teal: channel('teal'),
        info: channel('info'),
        alert: channel('alert'),
        ok: {
          DEFAULT: channel('ok'),
          bg: 'var(--ok-bg)',
        },
        warn: {
          DEFAULT: channel('warn'),
          bg: 'var(--warn-bg)',
        },
        bad: {
          DEFAULT: channel('bad'),
          bg: 'var(--bad-bg)',
          deep: channel('bad-deep'),
        },
        chart: {
          '2a': channel('chart-2a'),
          '2b': channel('chart-2b'),
          '3a': channel('chart-3a'),
          '3b': channel('chart-3b'),
          '3c': channel('chart-3c'),
        },
        yellow: 'var(--yellow)',
        'on-ink': {
          DEFAULT: 'var(--on-ink)',
          muted: 'var(--on-ink-muted)',
        },
      },
      backgroundImage: {
        'grad-primary': 'var(--grad-primary)',
        'grad-surface': 'var(--grad-surface)',
        'grad-tile': 'var(--grad-tile)',
        'grad-avatar': 'var(--grad-avatar)',
        'grad-accent-text': 'var(--grad-accent-text)',
        'grad-gold': 'var(--grad-gold)',
      },
      fontFamily: {
        sans: ['var(--f-sans)'],
        display: ['var(--f-display)'],
        serif: ['var(--f-serif)'],
        mono: ['var(--f-mono)'],
      },
      borderRadius: {
        token: 'var(--r)',
        'token-sm': 'var(--r-sm)',
        'token-md': 'var(--r-md)',
        'token-lg': 'var(--r-lg)',
      },
      spacing: {
        sec: 'var(--sec)',
      },
    },
  },
  plugins: [],
};
