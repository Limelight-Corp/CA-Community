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

export * from './theme-utils';
