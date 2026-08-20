'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace.store';
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
import { cn } from '@/utils/cn';

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();

  const slug = (params?.workspaceSlug as string) || currentWorkspace?.slug;

  const activeWorkspace =
    currentWorkspace ||
    (slug ? workspaces.find((w) => w.slug === slug) : null) ||
    workspaces[0] ||
    (slug
      ? {
          id: slug,
          name: slug.replace(/-/g, ' '),
          slug,
          role: 'OWNER',
        }
      : null);

  const displayName = activeWorkspace?.name || 'Workspace';
  const displaySlug = activeWorkspace?.slug || 'workspace';

  const handleSwitchWorkspace = (ws: (typeof workspaces)[0]) => {
    queryClient.removeQueries();
    setCurrentWorkspace(ws);
    router.push(`/${ws.slug}/dashboard`);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full text-left focus:outline-none">
          <div className="flex w-full items-center justify-between rounded-xl border border-border/80 bg-[#0b101f] p-2 sm:p-2.5 text-left shadow-md transition-colors hover:border-primary/50 hover:bg-slate-900/80 cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                fallback={displayName}
                size="sm"
                className="rounded-lg bg-primary/15 text-primary border border-primary/30 font-bold text-xs shrink-0"
              />
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-semibold text-white capitalize">
                  {displayName}
                </span>
                <span className="truncate text-[10px] text-slate-400 font-mono">
                  /{displaySlug}
                </span>
              </div>
            </div>
            <svg
              className="h-3.5 w-3.5 shrink-0 text-slate-400 ml-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m7 15 5 5 5-5" />
              <path d="m7 9 5-5 5 5" />
            </svg>
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="left"
          className="w-60 bg-[#0b101f] border-border/80 shadow-2xl rounded-2xl p-1.5"
        >
          <DropdownMenuLabel className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider px-2 py-1.5">
            Your Workspaces
          </DropdownMenuLabel>
          {workspaces.length > 0 ? (
            workspaces.map((ws) => {
              const isCurrent = activeWorkspace && ws.slug === activeWorkspace.slug;
              return (
                <DropdownMenuItem
                  key={ws.id || ws.slug}
                  onClick={() => handleSwitchWorkspace(ws)}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-2.5 py-2 my-0.5 cursor-pointer',
                    isCurrent
                      ? 'bg-primary/20 text-white font-semibold border border-primary/30'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Avatar
                      fallback={ws.name}
                      size="sm"
                      className="h-5 w-5 text-[9px] bg-slate-900 border border-border shrink-0"
                    />
                    <span className="truncate text-xs">{ws.name}</span>
                  </div>
                  {ws.role && (
                    <Badge
                      size="sm"
                      variant="secondary"
                      className="text-[9px] font-mono shrink-0 ml-1"
                    >
                      {String(ws.role)}
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem
              onClick={() => router.push('/workspaces')}
              className="text-slate-400 text-xs"
            >
              No other workspaces
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-border/60 my-1" />
          <DropdownMenuItem
            onClick={() => router.push('/workspaces')}
            className="text-primary hover:text-primary/80 rounded-xl px-2.5 py-2 cursor-pointer font-medium"
          >
            <svg
              className="mr-2 h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
            <span className="text-xs">Manage Workspaces</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
