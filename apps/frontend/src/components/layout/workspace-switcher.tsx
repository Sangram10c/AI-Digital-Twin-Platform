'use client';

import { useRouter, useParams } from 'next/navigation';
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
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();

  const slug = (params?.workspaceSlug as string) || currentWorkspace?.slug || 'default';

  // Fallback demo workspaces if store is fresh
  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: 'Primary Engineering',
      slug: slug || 'primary',
      role: 'OWNER',
    };

  return (
    <div className={cn('relative w-full', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger className="w-full">
          <div className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-2 text-left shadow-xs transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                fallback={activeWorkspace.name}
                size="sm"
                className="rounded-md bg-primary/10 text-primary font-bold"
              />
              <div className="flex flex-col truncate">
                <span className="truncate text-xs font-semibold text-foreground">
                  {activeWorkspace.name}
                </span>
                <span className="truncate text-[10px] text-muted-foreground font-mono">
                  /{activeWorkspace.slug}
                </span>
              </div>
            </div>
            <svg
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-1"
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

        <DropdownMenuContent align="left" className="w-60">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.length > 0 ? (
            workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => {
                  setCurrentWorkspace(ws);
                  router.push(`/${ws.slug}/dashboard`);
                }}
                className={cn(
                  'flex items-center justify-between',
                  ws.slug === activeWorkspace.slug && 'bg-accent font-semibold',
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <Avatar fallback={ws.name} size="sm" className="h-5 w-5 text-[10px]" />
                  <span className="truncate">{ws.name}</span>
                </div>
                {ws.role && (
                  <Badge size="sm" variant="secondary" className="text-[9px]">
                    {String(ws.role)}
                  </Badge>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem
              onClick={() => router.push(`/${activeWorkspace.slug}/dashboard`)}
              className="font-semibold bg-accent"
            >
              <div className="flex items-center gap-2 truncate">
                <Avatar fallback={activeWorkspace.name} size="sm" className="h-5 w-5 text-[10px]" />
                <span className="truncate">{activeWorkspace.name}</span>
              </div>
              <Badge size="sm" variant="secondary" className="text-[9px]">
                Active
              </Badge>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/workspaces')}>
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
            <span>All Workspaces</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
