'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import type { UserProfile, TokenResponse, LoginInput, RegisterInput } from '@prestamos/shared';
import { api, getTokens, setTokens, clearTokens } from '../lib/api-client';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on mount
  useEffect(() => {
    const tokens = getTokens();
    if (!tokens) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    // Try to restore from cached user first
    const cached = localStorage.getItem('user');
    if (cached) {
      try {
        const user = JSON.parse(cached) as UserProfile;
        setState({ user, isLoading: false, isAuthenticated: true });
        return;
      } catch {
        // ignore, re-fetch
      }
    }

    // Fetch /me to validate token
    api.get<UserProfile>('/api/auth/me')
      .then((user) => {
        localStorage.setItem('user', JSON.stringify(user));
        setState({ user, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        clearTokens();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await api.post<TokenResponse>('/api/auth/login', input);
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    localStorage.setItem('user', JSON.stringify(data.user));
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await api.post<TokenResponse>('/api/auth/register', input);
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    localStorage.setItem('user', JSON.stringify(data.user));
    setState({ user: data.user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
