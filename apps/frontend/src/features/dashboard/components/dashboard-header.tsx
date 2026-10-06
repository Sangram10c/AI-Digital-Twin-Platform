'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth.store';
import { Workspace } from '@/types/workspace.types';

interface DashboardHeaderProps {
  workspace: Workspace;
  hasRepositories: boolean;
  isGithubConnected: boolean;
}

export function DashboardHeader({
  workspace,
  hasRepositories,
  isGithubConnected,
}: DashboardHeaderProps) {
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Developer';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {getGreeting()}, {displayName}
          </h1>
          <Badge
            variant={hasRepositories ? 'ai' : isGithubConnected ? 'success' : 'secondary'}
            size="sm"
            className="font-mono text-[10px]"
          >
            {workspace.name}
          </Badge>
        </div>
        <p className="text-xs text-slate-400">
          AI Digital Twin workspace overview, codebase telemetry, and conversational intelligence.
        </p>
      </div>

      {!hasRepositories && (
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/${workspace.slug}/repositories`}>
            <Button
              variant="default"
              size="sm"
              className="text-xs gap-1.5 h-8 bg-blue-600 hover:bg-blue-500 text-white"
            >
              <span>+ Connect Repo</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
