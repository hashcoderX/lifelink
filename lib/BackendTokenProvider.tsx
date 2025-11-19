"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { backendLogin } from './backend';

type Ctx = {
  token: string | null;
  setToken: (t: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const BackendTokenContext = createContext<Ctx | undefined>(undefined);

export function BackendTokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const t = window.localStorage.getItem('backend_token');
    if (t) setToken(t);
  }, []);

  // Prefer token from NextAuth session if available
  useEffect(() => {
    const sessToken = (session as any)?.accessToken as string | undefined;
    if (sessToken) {
      setToken(sessToken);
      window.localStorage.setItem('backend_token', sessToken);
    }
  }, [session]);

  const login = async (email: string, password: string) => {
    const r = await backendLogin(email, password);
    setToken(r.token);
    window.localStorage.setItem('backend_token', r.token);
  };

  const logout = () => {
    setToken(null);
    window.localStorage.removeItem('backend_token');
  };

  const value = useMemo(() => ({ token, setToken, login, logout }), [token]);

  return <BackendTokenContext.Provider value={value}>{children}</BackendTokenContext.Provider>;
}

export function useBackendToken() {
  const ctx = useContext(BackendTokenContext);
  if (!ctx) throw new Error('useBackendToken must be used within BackendTokenProvider');
  return ctx;
}
