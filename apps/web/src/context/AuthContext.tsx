'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

/** The signed-in member as the browser sees it (from GET /api/auth/me). */
export interface MemberUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  emailVerified: boolean;
  /** Approved membership — unlocks members-only resources. */
  isMember: boolean;
  photoUrl?: string;
  initials: string;
}

interface AuthContextType {
  user: MemberUser | null;
  isLoading: boolean;
  /** Stores the user returned by the login / register API (the session cookie is already set). */
  login: (user: Omit<MemberUser, 'initials'>) => void;
  logout: () => Promise<void>;
  /** Re-reads the session from the server (e.g. after a profile change). */
  refresh: () => Promise<void>;
}

export function getInitials(name?: string): string {
  if (!name) return 'CA';
  const clean = name.replace(/^CA\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (first && second) return `${first[0] || ''}${second[0] || ''}`.toUpperCase();
  if (first && first.length >= 2) return first.slice(0, 2).toUpperCase();
  return 'CA';
}

const withInitials = (u: Omit<MemberUser, 'initials'>): MemberUser => ({ ...u, initials: getInitials(u.name) });
const AUTH_EVENT = 'ascend_auth_change';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MemberUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as { user?: Omit<MemberUser, 'initials'> | null } | null;
      setUser(data?.user ? withInitials(data.user) : null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Leftovers from the old prototype login, which kept a fake session in the browser.
    try {
      localStorage.removeItem('ascend_member_user');
      localStorage.removeItem('ascend_member_token');
      localStorage.removeItem('ascend_offline_passes');
    } catch {}
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(AUTH_EVENT, onChange);
    window.addEventListener('focus', onChange);
    return () => {
      window.removeEventListener(AUTH_EVENT, onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [refresh]);

  const login = useCallback((u: Omit<MemberUser, 'initials'>) => {
    setUser(withInitials(u));
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {}
    setUser(null);
    window.dispatchEvent(new Event(AUTH_EVENT));
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, logout, refresh }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
