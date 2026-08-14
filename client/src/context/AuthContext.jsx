import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler } from '../lib/apiClient';
import { getToken, setToken, getStoredUser, setStoredUser, clearAuth } from '../lib/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const token = getToken();
      if (!token) {
        setInitializing(false);
        return;
      }
      try {
        const res = await api.me();
        if (cancelled) return;
        setUser(res.data);
        setStoredUser(res.data);
      } catch {
        if (cancelled) return;
        clearAuth();
        setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    setToken(res.data.accessToken);
    setStoredUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.register(payload);
    setToken(res.data.accessToken);
    setStoredUser(res.data.user);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
