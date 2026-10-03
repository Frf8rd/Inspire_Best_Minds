import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { setUnauthorizedHandler } from '@/lib/api-client';

import { authApi } from './api';
import type { LoginBody, RegisterBody, ResetPasswordBody, User } from './types';

type Status = 'loading' | 'authenticated' | 'guest';

type AuthContextValue = {
  status: Status;
  user: User | null;
  login: (body: LoginBody) => Promise<void>;
  register: (body: RegisterBody) => Promise<void>;
  resetPassword: (body: ResetPasswordBody) => Promise<void>;
  logout: () => Promise<void>;
  /** Reîncarcă utilizatorul din GET /auth/me (ex. după Google). Returnează false dacă nu există sesiune. */
  refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await authApi.me();
      setUser(me);
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  // Restaurează sesiunea la pornirea aplicației.
  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  // Dacă sesiunea expiră definitiv, revenim la ecranele de autentificare.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const value: AuthContextValue = {
    status: !ready ? 'loading' : user ? 'authenticated' : 'guest',
    user,
    refresh,
    login: async (body) => setUser((await authApi.login(body)).user),
    register: async (body) => setUser((await authApi.register(body)).user),
    resetPassword: async (body) => setUser((await authApi.resetPassword(body)).user),
    logout: async () => {
      await authApi.logout().catch(() => undefined); // chiar dacă cererea eșuează, ieșim local
      setUser(null);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth trebuie folosit în interiorul <AuthProvider>.');
  return ctx;
}
