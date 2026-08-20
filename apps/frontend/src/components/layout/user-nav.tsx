'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useTheme } from '@/components/providers/theme-provider';
import { authService } from '@/services/auth.service';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/user.types';

export function UserNav() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, tokens, logout } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      if (tokens?.refreshToken) {
        await authService.logout(tokens.refreshToken);
      }
    } catch {
      // Best-effort backend session revocation
    } finally {
      // Clear TanStack query cache completely so no stale user data persists
      queryClient.clear();
      logout();
      router.push('/login');
    }
  };

  const displayName =
    user?.displayName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    user?.email?.split('@')[0] ||
    'Developer';

  const platformRole = user?.role || UserRole.USER;
  const workspaceRole = currentWorkspace?.role;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 rounded-full border border-border p-0.5 transition-colors hover:border-primary/50 cursor-pointer">
          <Avatar
            src={user?.avatar}
            fallback={displayName}
            size="sm"
            className="bg-primary/20 text-primary font-bold text-xs"
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="right"
        className="w-60 bg-[#0b101f] border-slate-800 text-white shadow-2xl"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1.5 py-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white truncate max-w-[130px]">
                {displayName}
              </span>
              <Badge
                size="sm"
                variant={platformRole === UserRole.ADMIN ? 'ai' : 'secondary'}
                className="text-[9px]"
              >
                {platformRole}
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 truncate font-mono">
              {user?.email || 'user@domain.com'}
            </span>
            {workspaceRole && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                  Workspace:
                </span>
                <span className="text-[10px] font-semibold text-blue-400">{workspaceRole}</span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />

        {platformRole === UserRole.ADMIN && (
          <DropdownMenuItem
            onClick={() => router.push('/admin')}
            className="cursor-pointer hover:bg-slate-900"
          >
            <svg
              className="mr-2 h-3.5 w-3.5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span className="font-semibold text-blue-400">Admin Console</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="cursor-pointer hover:bg-slate-900"
        >
          <svg
            className="mr-2 h-3.5 w-3.5 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <span className="text-xs">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-slate-800" />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 cursor-pointer"
        >
          <svg
            className="mr-2 h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span className="text-xs font-semibold">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
