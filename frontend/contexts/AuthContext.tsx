'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/services/api';
import { UserProfile, LoginCredentials, RegisterData } from '@/types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ──────────────────────────────────────
// Zustand store (persisted to localStorage)
// ──────────────────────────────────────
interface AuthStore {
  user: UserProfile | null;
  token: string | null;
  setAuth: (user: UserProfile, token: string) => void;
  setUser: (user: UserProfile) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: 'fm-auth' }
  )
);

// ──────────────────────────────────────
// Context types
// ──────────────────────────────────────
interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, setAuth, setUser, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // On mount: validate persisted token
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = Cookies.get('fm_token') ?? token;
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const { data } = await authApi.me();
        const userData = data?.data?.user ?? data?.data ?? data?.user ?? data;
        setUser(userData);
      } catch {
        clearAuth();
        Cookies.remove('fm_token');
      } finally {
        setIsLoading(false);
      }
    };
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await authApi.login({
        emailOrUsername: credentials.emailOrUsername,
        password: credentials.password,
      });
      const res = response.data;
      const payload = res?.data ?? res;
      const u = payload?.user ?? payload;
      const t = payload?.accessToken ?? payload?.token ?? res?.accessToken ?? res?.token;
      const expiresIn = payload?.expiresIn ?? res?.expiresIn ?? 900;
      setAuth(u, t);
      if (t) {
        Cookies.set('fm_token', t, {
          expires: expiresIn ? expiresIn / 86400 : 7,
          sameSite: 'lax',
        });
      }
      toast.success('Welcome back!');
      router.push('/map');
    },
    [setAuth, router]
  );

  const register = useCallback(
    async (data: RegisterData) => {
      const response = await authApi.register({
        username: data.username,
        email: data.email,
        displayName: data.displayName,
        password: data.password,
      });
      const res = response.data;
      const payload = res?.data ?? res;
      const u = payload?.user ?? payload;
      const t = payload?.accessToken ?? payload?.token ?? res?.accessToken ?? res?.token;
      const expiresIn = payload?.expiresIn ?? res?.expiresIn ?? 900;
      setAuth(u, t);
      if (t) {
        Cookies.set('fm_token', t, {
          expires: expiresIn ? expiresIn / 86400 : 7,
          sameSite: 'lax',
        });
      }
      toast.success('Account created successfully!');
      router.push('/map');
    },
    [setAuth, router]
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    clearAuth();
    Cookies.remove('fm_token');
    toast.success('Logged out');
    router.push('/login');
  }, [clearAuth, router]);

  const updateUser = useCallback(
    (data: Partial<UserProfile>) => {
      if (user) setUser({ ...user, ...data });
    },
    [user, setUser]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        loading: isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
