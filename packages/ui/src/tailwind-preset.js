/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        card: 'var(--card)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        soft: 'var(--soft)',
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
        },
        lime: {
          DEFAULT: 'var(--lime)',
          ink: 'var(--lime-ink)',
          deep: 'var(--lime-deep)',
        },
        sky: 'var(--sky)',
        cobalt: 'var(--cobalt)',
        navy: 'var(--navy)',
        mist: 'var(--mist)',
        ok: {
          DEFAULT: 'var(--ok)',
          bg: 'var(--ok-bg)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          bg: 'var(--warn-bg)',
        },
        bad: {
          DEFAULT: 'var(--bad)',
          bg: 'var(--bad-bg)',
        },
        yellow: 'var(--yellow)',
        'on-ink': {
          DEFAULT: 'var(--on-ink)',
          muted: 'var(--on-ink-muted)',
        },
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
