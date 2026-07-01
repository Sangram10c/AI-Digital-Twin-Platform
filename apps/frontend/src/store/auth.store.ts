/**
 * Auth Store (Zustand)
 *
 * Manages authentication state globally.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: true,

        login: (user: User, token: string) => {
          localStorage.setItem('access_token', token);
          set({ user, isAuthenticated: true, isLoading: false });
        },

        logout: () => {
          localStorage.removeItem('access_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true, isLoading: false });
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      },
    ),
    { name: 'AuthStore' },
  ),
);
