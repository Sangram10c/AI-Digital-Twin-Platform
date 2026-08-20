'use client';

import * as React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { workspaceService } from '@/services/workspace.service';
import { authService } from '@/services/auth.service';

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
}

const AuthContext = React.createContext<AuthContextValue>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, login, logout, setLoading, isAuthenticated, isLoading } = useAuthStore();
  const { setWorkspaces, resolveActiveWorkspace } = useWorkspaceStore();

  React.useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (typeof window === 'undefined') return;

      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const workspaces = await workspaceService.getWorkspaces();
        if (isMounted) {
          setWorkspaces(workspaces);
          resolveActiveWorkspace();
          if (user) {
            login(user, { accessToken, refreshToken: refreshToken || '' });
          }
          setLoading(false);
        }
      } catch {
        if (refreshToken) {
          try {
            const newTokens = await authService.refreshToken(refreshToken);
            if (isMounted && user) {
              login(user, newTokens);
              const workspaces = await workspaceService.getWorkspaces();
              setWorkspaces(workspaces);
              resolveActiveWorkspace();
              setLoading(false);
              return;
            }
          } catch {
            // Refresh failed
          }
        }

        if (isMounted) {
          logout();
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [login, logout, setLoading, setWorkspaces, resolveActiveWorkspace, user]);

  const value = React.useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      user,
    }),
    [isAuthenticated, isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return React.useContext(AuthContext);
}
