'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/store/workspace.store';
import { repositoryService } from '@/services/repository.service';
import { RepositoryHeader, RepositoryStatsCard, RepositorySkeleton } from '@/features/repositories';
import { ErrorState } from '@/components/shared/error-state';

interface CheckpointInfo {
  phase?: string;
  status?: string;
  processedCount?: number;
  totalCount?: number;
}

export default function RepositoryDetailPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';
  const repoId = (params?.repoId as string) || '';
  const { currentWorkspace, workspaces } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = React.useState<'overview' | 'checkpoints' | 'knowledge'>(
    'overview',
  );
  const [isSyncing, setIsSyncing] = React.useState(false);

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
    };

  const workspaceId = activeWorkspace.id;

  // Real repository query
  const {
    data: repository,
    isLoading: isRepoLoading,
    isError: isRepoError,
    refetch: refetchRepo,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'repository', repoId],
    queryFn: () => repositoryService.getRepositoryById(workspaceId, repoId),
    enabled: Boolean(workspaceId && workspaceId !== 'default' && repoId),
  });

  // Pipeline checkpoints query
  const { data: syncStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['workspace', workspaceId, 'repository', repoId, 'sync-status'],
    queryFn: () => repositoryService.getSyncStatus(repoId, workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default' && repoId),
  });

  // Trigger sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      return repositoryService.triggerSync(repoId, workspaceId, true);
    },
    onSettled: () => {
      setIsSyncing(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'repository', repoId],
      });
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'repository', repoId, 'sync-status'],
      });
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'repositories'],
      });
    },
  });

  if (isRepoLoading && !repository) {
    return <RepositorySkeleton />;
  }

  if (isRepoError || !repository) {
    return (
      <ErrorState
        title="Repository Not Found"
        description="We couldn't find the requested repository in this workspace."
        onRetry={refetchRepo}
      />
    );
  }

  const checkpoints: Record<string, CheckpointInfo> =
    (syncStatus?.checkpoints as Record<string, CheckpointInfo>) || {};
  const checkpointEntries = Object.entries(checkpoints);

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* 1. Header with Name, Branch, and Actions */}
      <RepositoryHeader
        repository={repository}
        slug={slug}
        isSyncing={isSyncing || syncMutation.isPending}
        onTriggerSync={() => syncMutation.mutate()}
      />

      {/* 2. Key Metadata Cards */}
      <RepositoryStatsCard repository={repository} />

      {/* 3. Tabbed Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors ${
            activeTab === 'overview'
              ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Overview & Telemetry
        </button>
        <button
          onClick={() => setActiveTab('checkpoints')}
          className={`pb-3 transition-colors ${
            activeTab === 'checkpoints'
              ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pipeline Checkpoints ({checkpointEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`pb-3 transition-colors ${
            activeTab === 'knowledge'
              ? 'text-blue-400 border-b-2 border-blue-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          AI Knowledge & Search
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-bold text-white">
                  Repository Ingestion Details
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Full synchronizer status and background queue telemetry.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-1">
                    <span className="text-[11px] text-slate-400">Last Synced</span>
                    <div className="font-mono text-white font-semibold">
                      {repository.lastSyncedAt
                        ? new Date(repository.lastSyncedAt).toLocaleString()
                        : 'Never synced'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-1">
                    <span className="text-[11px] text-slate-400">Default Branch</span>
                    <div className="font-mono text-white font-semibold">
                      {repository.defaultBranch || 'main'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-xs text-white">Full Ingestion Pipeline</div>
                    <p className="text-[11px] text-slate-400">
                      Entity sync → documentation crawl → AST heuristics → pgvector chunks
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ai"
                    disabled={isSyncing || syncMutation.isPending}
                    onClick={() => syncMutation.mutate()}
                    className="text-xs"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
              <CardHeader className="p-0">
                <CardTitle className="text-base font-bold text-white">Quick Actions</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Interact with repository intelligence.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0 pt-2 space-y-2">
                <Link href={`/${slug}/chat?repositoryId=${repository.id}`} className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs gap-2"
                  >
                    <span>💬</span>
                    <span>Chat with Codebase</span>
                  </Button>
                </Link>

                <Link href={`/${slug}/search?repositoryId=${repository.id}`} className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs gap-2"
                  >
                    <span>🔍</span>
                    <span>Hybrid Search Code</span>
                  </Button>
                </Link>

                <Link href={`/${slug}/knowledge?repositoryId=${repository.id}`} className="block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs gap-2"
                  >
                    <span>📚</span>
                    <span>View Extracted Chunks</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Checkpoints */}
      {activeTab === 'checkpoints' && (
        <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
          <CardHeader className="p-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white">Pipeline Checkpoints</CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Execution phases stored during repository extraction and vectorization.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchStatus()}
              className="text-xs text-slate-400 hover:text-white"
            >
              Refresh
            </Button>
          </CardHeader>

          <CardContent className="p-0 pt-2 space-y-3">
            {checkpointEntries.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
                No checkpoints recorded yet. Click &quot;Trigger Sync&quot; to begin full ingestion.
              </div>
            ) : (
              checkpointEntries.map(([phase, cp]) => (
                <div
                  key={phase}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-white capitalize">
                      {phase.replace(/_/g, ' ')}
                    </span>
                    {cp.processedCount !== undefined && (
                      <div className="text-[11px] text-slate-400 font-mono">
                        Processed: {cp.processedCount}
                        {cp.totalCount ? ` / ${cp.totalCount}` : ''}
                      </div>
                    )}
                  </div>

                  <Badge
                    size="sm"
                    variant={
                      cp.status === 'COMPLETED'
                        ? 'success'
                        : cp.status === 'RUNNING'
                          ? 'warning'
                          : cp.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                    }
                    dot
                    className="font-mono text-[10px]"
                  >
                    {cp.status || 'PENDING'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: AI Knowledge & Search */}
      {activeTab === 'knowledge' && (
        <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-4">
          <CardHeader className="p-0">
            <CardTitle className="text-base font-bold text-white">AI Knowledge Grounding</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Code chunks and AST heuristic digests available for RAG conversations.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 pt-2 space-y-3">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">pgvector Chunks</span>
                <Badge variant="ai" size="sm" className="font-mono text-[10px]">
                  Active
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Source files are tokenized, parsed for symbols and docstrings, and stored with
                768-dimensional embeddings for cosine similarity retrieval.
              </p>
            </div>

            <div className="pt-2">
              <Link href={`/${slug}/chat?repositoryId=${repository.id}`}>
                <Button variant="ai" size="sm" className="text-xs">
                  Launch AI Twin for this Repository →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
