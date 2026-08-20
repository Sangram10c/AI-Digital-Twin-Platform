/**
 * UI Store (Zustand)
 *
 * Manages UI state like sidebar visibility, theme, modals.
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  isSidebarOpen: boolean;
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isSidebarOpen: true,
      sidebarOpen: true,
      theme: 'system',

      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
          sidebarOpen: !state.isSidebarOpen,
        })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open, sidebarOpen: open }),
      setTheme: (theme: 'light' | 'dark' | 'system') => set({ theme }),
    }),
    { name: 'UIStore' },
  ),
);
