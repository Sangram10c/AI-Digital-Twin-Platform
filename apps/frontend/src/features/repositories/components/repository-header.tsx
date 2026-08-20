'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncStatusBadge } from './sync-status-badge';
import { Repository } from '@/services/repository.service';

interface RepositoryHeaderProps {
  repository: Repository;
  slug: string;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export function RepositoryHeader({
  repository,
  slug,
  isSyncing,
  onTriggerSync,
}: RepositoryHeaderProps) {
  const repoName = repository.fullName || `${repository.owner || 'org'}/${repository.name}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-800/80">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/${slug}/repositories`}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Repositories
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{repoName}</h1>
          <SyncStatusBadge status={repository.status} isSyncing={isSyncing} />
          {repository.isPrivate ? (
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              Private
            </Badge>
          ) : (
            <Badge variant="secondary" size="sm" className="font-mono text-[10px]">
              Public
            </Badge>
          )}
        </div>

        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          {repository.description ||
            'Full AST intelligence, vector embedding pipeline, and conversational twin.'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={isSyncing}
          onClick={onTriggerSync}
          className="text-xs gap-1.5 h-8"
        >
          <svg
            className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-amber-400' : 'text-slate-400'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>{isSyncing ? 'Syncing...' : 'Trigger Sync'}</span>
        </Button>

        <Link href={`/${slug}/chat?repositoryId=${repository.id}`}>
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

        {repository.htmlUrl && (
          <a href={repository.htmlUrl} target="_blank" rel="noopener noreferrer">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 gap-1 text-slate-400 hover:text-white"
            >
              <span>GitHub</span>
              <span>↗</span>
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
