import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authApi from '../api/authApi';
import { setUnauthorizedHandler } from '../api/client';
import {
  getAccessToken,
  setTokens,
  clearAuthStorage,
  getStoredUser,
  setStoredUser,
} from '../services/storageService';
import { unregisterPushToken } from '../services/notificationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(async () => {
    // Must run before clearAuthStorage — unregistering needs a valid token
    // to authenticate the request that removes it server-side.
    await unregisterPushToken();
    await clearAuthStorage();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const cached = await getStoredUser();
      if (cached && !cancelled) setUser(cached);

      const token = await getAccessToken();
      if (!token) {
        if (!cancelled) setInitializing(false);
        return;
      }
      try {
        // GET /auth/me only echoes the JWT payload (userId, role, email) —
        // it does not include `name`, so merge onto the cached user instead
        // of replacing it outright, or the display name would disappear on
        // every app restart.
        const freshUser = await authApi.me();
        if (cancelled) return;
        const merged = { ...cached, ...freshUser };
        setUser(merged);
        await setStoredUser(merged);
      } catch {
        if (cancelled) return;
        await clearAuthStorage();
        setUser(null);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authApi.login({ email, password });
    await setTokens(result);
    await setStoredUser(result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await authApi.register(payload);
    await setTokens(result);
    await setStoredUser(result.user);
    setUser(result.user);
    return result.user;
  }, []);

  const value = useMemo(
    () => ({ user, initializing, isAuthenticated: !!user, login, register, logout }),
    [user, initializing, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
