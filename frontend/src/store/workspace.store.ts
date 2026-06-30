/**
 * Workspace Store (Zustand)
 *
 * Manages the current active workspace state.
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  setCurrentWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    (set) => ({
      currentWorkspace: null,
      workspaces: [],

      setCurrentWorkspace: (workspace: Workspace) => set({ currentWorkspace: workspace }),
      setWorkspaces: (workspaces: Workspace[]) => set({ workspaces }),
    }),
    { name: 'WorkspaceStore' },
  ),
);
