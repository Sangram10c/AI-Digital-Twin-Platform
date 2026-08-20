'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Repository } from '@/services/repository.service';

interface RepositorySummaryProps {
  repositories: Repository[];
  slug: string;
}

export function RepositorySummary({ repositories, slug }: RepositorySummaryProps) {
  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-white">Connected Repositories</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Source code repositories indexed into PostgreSQL vector embeddings.
          </CardDescription>
        </div>
        <Link href={`/${slug}/repositories`}>
          <Button variant="ghost" size="sm" className="text-xs text-blue-400 hover:text-blue-300">
            View All →
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-0 pt-2 space-y-2.5">
        {repositories.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-2">
            <p className="text-xs text-slate-400">No repositories linked to this workspace yet.</p>
            <Link href={`/${slug}/repositories`}>
              <Button variant="ai" size="sm" className="text-xs">
                + Link Repository
              </Button>
            </Link>
          </div>
        ) : (
          repositories.slice(0, 4).map((repo) => {
            const isCompleted = repo.status === 'COMPLETED';
            const isSyncing = repo.status === 'SYNCING';
            const isError = repo.status === 'FAILED' || repo.status === 'ERROR';

            return (
              <div
                key={repo.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-sm font-bold shrink-0">
                    {repo.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white truncate">{repo.name}</span>
                      {repo.language && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {repo.language}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {repo.owner ? `${repo.owner}/${repo.name}` : repo.name} • branch:{' '}
                      {repo.defaultBranch || 'main'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 ml-3">
                  <Badge
                    size="sm"
                    variant={
                      isCompleted
                        ? 'success'
                        : isSyncing
                          ? 'warning'
                          : isError
                            ? 'destructive'
                            : 'secondary'
                    }
                    dot
                    className="font-mono text-[10px]"
                  >
                    {repo.status || 'READY'}
                  </Badge>

                  <Link href={`/${slug}/chat?repositoryId=${repo.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                      Chat
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
