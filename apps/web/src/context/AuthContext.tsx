'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface MemberUser {
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  role?: string;
  initials: string;
}

interface AuthContextType {
  user: MemberUser | null;
  isLoading: boolean;
  login: (userData: { name?: string; email?: string; mobile?: string; id?: string }, token?: string) => void;
  logout: () => void;
}

export function getInitials(name?: string): string {
  if (!name) return 'CA';
  const clean = name.replace(/^CA\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (first && second) {
    return `${first[0] || ''}${second[0] || ''}`.toUpperCase();
  }
  if (first && first.length >= 2) {
    return first.slice(0, 2).toUpperCase();
  }
  return 'CA';
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MemberUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(() => {
    try {
      const stored = localStorage.getItem('ascend_member_user');
      const token = localStorage.getItem('ascend_member_token');

      if (stored) {
        const parsed = JSON.parse(stored);
        const name = parsed.name || (parsed.mobile ? `CA Member ${parsed.mobile.slice(-4)}` : 'CA Member');
        setUser({
          ...parsed,
          name,
          email: parsed.email || '',
          initials: parsed.initials || getInitials(name),
        });
      } else if (token) {
        // Token exists but no profile cached, create default profile
        setUser({
          name: 'CA Kavya Reddy',
          email: 'kavya.reddy@example.com',
          initials: 'KR',
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener('ascend_auth_change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('ascend_auth_change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [loadUser]);

  const login = (
    userData: { name?: string; email?: string; mobile?: string; id?: string },
    token = 'ascend_token_session'
  ) => {
    const name = userData.name || (userData.mobile ? `CA Member ${userData.mobile.slice(-4)}` : 'CA Member');
    const fullUser: MemberUser = {
      ...userData,
      name,
      email: userData.email || '',
      initials: getInitials(name),
    };

    try {
      localStorage.setItem('ascend_member_user', JSON.stringify(fullUser));
      localStorage.setItem('ascend_member_token', token);
      document.cookie = `ascend_member_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}

    setUser(fullUser);
    window.dispatchEvent(new Event('ascend_auth_change'));
  };

  const logout = () => {
    try {
      localStorage.removeItem('ascend_member_user');
      localStorage.removeItem('ascend_member_token');
      document.cookie = 'ascend_member_token=; path=/; max-age=0; SameSite=Lax';
    } catch {}

    setUser(null);
    window.dispatchEvent(new Event('ascend_auth_change'));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
