'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { repositoryService, type Repository } from '@/services/repository.service';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { cn } from '@/utils/cn';

interface RepositorySelectorProps {
  workspaceId: string;
  selectedRepoId?: string | null;
  onSelectRepo: (repo: Repository | null) => void;
  className?: string;
}

export function RepositorySelector({
  workspaceId,
  selectedRepoId,
  onSelectRepo,
  className,
}: RepositorySelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: repositories = [], isLoading } = useQuery({
    queryKey: ['repositories', workspaceId],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const filteredRepos = repositories.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.owner && r.owner.toLowerCase().includes(term)) ||
      (r.language && r.language.toLowerCase().includes(term))
    );
  });

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search repositories by name or language..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 bg-slate-900/80 border-slate-800 focus:border-blue-500 text-white text-xs pl-8"
        />
        <svg
          className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* Repositories List */}
      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
        {/* All Workspace Option */}
        <div
          onClick={() => onSelectRepo(null)}
          className={cn(
            'flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer select-none',
            selectedRepoId === null || selectedRepoId === undefined
              ? 'bg-blue-950/60 border-blue-500/40 text-white'
              : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300',
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">🌐</span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">All Workspace Repositories</span>
              <span className="text-[10px] text-slate-400">
                Search across all connected codebases
              </span>
            </div>
          </div>
          {!selectedRepoId && (
            <Badge variant="ai" size="sm" className="text-[9px]">
              Selected
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-6 space-y-2">
            <LoadingSpinner size="sm" />
            <span className="text-xs text-slate-400 font-mono">Loading repositories...</span>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center p-4 text-xs text-slate-400 font-mono">
            No matching repositories found
          </div>
        ) : (
          filteredRepos.map((repo) => {
            const isSelected = selectedRepoId === repo.id;
            return (
              <div
                key={repo.id}
                onClick={() => onSelectRepo(repo)}
                className={cn(
                  'flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer select-none',
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500/40 text-white'
                    : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300',
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">📦</span>
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-white truncate">{repo.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {repo.owner ? `${repo.owner} • ` : ''}
                      {repo.defaultBranch || 'main'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {repo.language && (
                    <Badge variant="secondary" size="sm" className="text-[9px] font-mono">
                      {repo.language}
                    </Badge>
                  )}
                  {isSelected && (
                    <Badge variant="ai" size="sm" className="text-[9px]">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
