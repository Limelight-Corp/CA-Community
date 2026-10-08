'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ThemeTokens,
  DEFAULT_DARK_TOKENS,
  DEFAULT_LIGHT_TOKENS,
} from '@ascend/shared';

interface ThemeContextType {
  mode: 'dark' | 'light';
  setMode: (mode: 'dark' | 'light') => void;
  toggleMode: () => void;
  tokens: ThemeTokens;
  updateTokens: (tokens: Partial<ThemeTokens>) => void;
  resetTokens: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: 'dark' | 'light';
  initialTokens?: Partial<ThemeTokens>;
}

export function ThemeProvider({
  children,
  initialMode = 'dark',
  initialTokens,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<'dark' | 'light'>(initialMode);
  const [customTokens, setCustomTokens] = useState<Partial<ThemeTokens>>(initialTokens || {});

  const baseTokens = mode === 'dark' ? DEFAULT_DARK_TOKENS : DEFAULT_LIGHT_TOKENS;
  const currentTokens: ThemeTokens = { ...baseTokens, ...customTokens };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);

    // Apply tokens directly to CSS variables
    root.style.setProperty('--bg', currentTokens.bg);
    root.style.setProperty('--card', currentTokens.card);
    root.style.setProperty('--fg', currentTokens.fg);
    root.style.setProperty('--muted', currentTokens.muted);
    root.style.setProperty('--faint', currentTokens.faint);
    root.style.setProperty('--line', currentTokens.line);
    root.style.setProperty('--soft', currentTokens.soft);
    root.style.setProperty('--lime', currentTokens.lime);
    root.style.setProperty('--lime-ink', currentTokens.limeInk);
    root.style.setProperty('--lime-deep', currentTokens.limeDeep);
    root.style.setProperty('--sky', currentTokens.sky);
    root.style.setProperty('--cobalt', currentTokens.cobalt);
    root.style.setProperty('--navy', currentTokens.navy);
    root.style.setProperty('--mist', currentTokens.mist);
    root.style.setProperty('--ok', currentTokens.ok);
    root.style.setProperty('--ok-bg', currentTokens.okBg);
    root.style.setProperty('--warn', currentTokens.warn);
    root.style.setProperty('--warn-bg', currentTokens.warnBg);
    root.style.setProperty('--bad', currentTokens.bad);
    root.style.setProperty('--bad-bg', currentTokens.badBg);
    root.style.setProperty('--yellow', currentTokens.yellow);
    root.style.setProperty('--r', currentTokens.radius);
  }, [mode, currentTokens]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateTokens = (newTokens: Partial<ThemeTokens>) => {
    setCustomTokens((prev) => ({ ...prev, ...newTokens }));
  };

  const resetTokens = () => {
    setCustomTokens({});
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        tokens: currentTokens,
        updateTokens,
        resetTokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Server-Side CSS Variable Injector string helper
 * Used in Next.js Root Layout to prevent Flash of Unstyled Content (FOUC)
 */
export function generateThemeCssVariables(tokens: ThemeTokens = DEFAULT_DARK_TOKENS): string {
  return `
    :root {
      --bg: ${tokens.bg};
      --card: ${tokens.card};
      --fg: ${tokens.fg};
      --muted: ${tokens.muted};
      --faint: ${tokens.faint};
      --line: ${tokens.line};
      --soft: ${tokens.soft};
      --lime: ${tokens.lime};
      --lime-ink: ${tokens.limeInk};
      --lime-deep: ${tokens.limeDeep};
      --sky: ${tokens.sky};
      --cobalt: ${tokens.cobalt};
      --navy: ${tokens.navy};
      --mist: ${tokens.mist};
      --ok: ${tokens.ok};
      --ok-bg: ${tokens.okBg};
      --warn: ${tokens.warn};
      --warn-bg: ${tokens.warnBg};
      --bad: ${tokens.bad};
      --bad-bg: ${tokens.badBg};
      --yellow: ${tokens.yellow};
      --r: ${tokens.radius};
      --f-sans: ${tokens.fontSans};
      --f-display: ${tokens.fontDisplay};
      --f-serif: ${tokens.fontSerif};
      --f-mono: ${tokens.fontMono};
    }
  `.replace(/\s+/g, ' ');
}

/**
 * WCAG 2.1 Contrast Ratio Calculator
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string): number => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length !== 6) return 0.5;
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    const a = [r, g, b].map((v) =>
      v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    return a[0]! * 0.2126 + a[1]! * 0.7152 + a[2]! * 0.0722;
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
