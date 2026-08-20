/**
 * Workspace Store (Zustand)
 * Manages the current active workspace and workspace resolution.
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Workspace } from '@/types/workspace.types';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setLoading: (loading: boolean) => void;
  resolveActiveWorkspace: (slug?: string) => Workspace | null;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        currentWorkspace: null,
        workspaces: [],
        isLoading: false,

        setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
        setWorkspaces: (workspaces) => set({ workspaces }),
        setLoading: (loading) => set({ isLoading: loading }),

        resolveActiveWorkspace: (slug?: string) => {
          const { workspaces, currentWorkspace } = get();
          if (!workspaces || workspaces.length === 0) {
            set({ currentWorkspace: null });
            return null;
          }

          if (slug) {
            const found = workspaces.find((w) => w.slug === slug);
            if (found) {
              set({ currentWorkspace: found });
              return found;
            }
          }

          if (currentWorkspace && workspaces.some((w) => w.id === currentWorkspace.id)) {
            return currentWorkspace;
          }

          const defaultWs = workspaces[0];
          set({ currentWorkspace: defaultWs });
          return defaultWs;
        },
      }),
      {
        name: 'workspace-storage',
        partialize: (state) => ({ currentWorkspace: state.currentWorkspace }),
      },
    ),
    { name: 'WorkspaceStore' },
  ),
);
