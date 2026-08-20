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

      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/${workspace.slug}/search`}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
            <svg
              className="h-3.5 w-3.5 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>Search</span>
          </Button>
        </Link>

        <Link href={`/${workspace.slug}/chat`}>
          <Button variant="ai" size="sm" className="text-xs gap-1.5 h-8">
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            <span>Ask AI</span>
          </Button>
        </Link>

        {!hasRepositories && (
          <Link href={`/${workspace.slug}/repositories`}>
            <Button
              variant="default"
              size="sm"
              className="text-xs gap-1.5 h-8 bg-blue-600 hover:bg-blue-500 text-white"
            >
              <span>+ Connect Repo</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
