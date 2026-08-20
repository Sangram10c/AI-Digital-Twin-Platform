/**
 * Auth Store (Zustand)
 * Manages client authentication state with complete session & cache isolation on logout.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '@/types/user.types';
import type { AuthTokens } from '@/types/auth.types';
import { useWorkspaceStore } from './workspace.store';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: true,

        login: (user: User, tokens: AuthTokens) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', tokens.accessToken);
            if (tokens.refreshToken) {
              localStorage.setItem('refresh_token', tokens.refreshToken);
            }
            // Set cookie for middleware access
            document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
          }
          set({ user, tokens, isAuthenticated: true, isLoading: false });
        },

        logout: () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('auth-storage');
            localStorage.removeItem('workspace-storage');
            // Clear cookie
            document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
          }
          // Reset workspace store to prevent leaking state to the next user
          useWorkspaceStore.getState().setCurrentWorkspace(null);
          useWorkspaceStore.getState().setWorkspaces([]);

          set({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true, isLoading: false });
        },

        setTokens: (tokens: AuthTokens) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', tokens.accessToken);
            if (tokens.refreshToken) {
              localStorage.setItem('refresh_token', tokens.refreshToken);
            }
            document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=604800; SameSite=Lax`;
          }
          set({ tokens });
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
