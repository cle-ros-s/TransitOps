import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { SESSION_KEY } from '../config/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  /** Alias for setAuth — used by LoginPage */
  setSession: (user: User, token: string) => void;
  clearAuth: () => void;
  /** Alias for clearAuth — used by UserMenu */
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      setSession: (user, token) => set({ user, token, isAuthenticated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
      clearSession: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: SESSION_KEY,
    }
  )
);
