'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/components/providers/theme-provider';
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
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = user?.name || user?.email?.split('@')[0] || 'Developer';
  const role = user?.role || UserRole.USER;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="flex items-center gap-2 rounded-full border border-border p-0.5 transition-colors hover:border-primary/50 cursor-pointer">
          <Avatar
            src={user?.avatar}
            fallback={displayName}
            size="sm"
            className="bg-primary/20 text-primary font-bold"
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="right" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground truncate max-w-[130px]">
                {displayName}
              </span>
              <Badge
                size="sm"
                variant={role === UserRole.ADMIN ? 'ai' : 'secondary'}
                className="text-[9px]"
              >
                {role}
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground truncate font-mono">
              {user?.email || 'user@local'}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {role === UserRole.ADMIN && (
          <DropdownMenuItem onClick={() => router.push('/admin')}>
            <svg
              className="mr-2 h-3.5 w-3.5 text-ai"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span className="font-semibold text-ai">Admin Panel</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <svg
            className="mr-2 h-3.5 w-3.5"
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
          <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
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
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
