'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/store/workspace.store';
import { analyticsService } from '@/services/analytics.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function AnalyticsPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
    };

  const workspaceId = activeWorkspace.id;

  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'overview'],
    queryFn: () => analyticsService.getOverview(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: repoAnalytics, isLoading: isRepoLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'repositories'],
    queryFn: () => analyticsService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: aiAnalytics } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'ai'],
    queryFn: () => analyticsService.getAi(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: searchAnalytics } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'search'],
    queryFn: () => analyticsService.getSearch(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: jobAnalytics } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'jobs'],
    queryFn: () => analyticsService.getJobs(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: healthAnalytics } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'health'],
    queryFn: () => analyticsService.getHealth(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const isLoading = isOverviewLoading || isRepoLoading;

  const domains = [
    {
      title: 'Repository Metrics',
      count: `${repoAnalytics?.totalRepositories ?? overview?.totalRepositories ?? 0} repos`,
      desc: `${repoAnalytics?.totalCommitsSynced ?? 0} commits, ${repoAnalytics?.totalPullRequestsSynced ?? 0} PRs synced`,
    },
    {
      title: 'AI Provider Usage',
      count: `${(aiAnalytics?.totalTokens ?? 0).toLocaleString()} tokens`,
      desc: `$${aiAnalytics?.estimatedCostUsd?.toFixed(4) ?? '0.0000'} est. cost, ${aiAnalytics?.totalRequests ?? 0} requests`,
    },
    {
      title: 'Search Performance',
      count: `${searchAnalytics?.averageLatencyMs ?? 0}ms avg`,
      desc: `${searchAnalytics?.totalQueries ?? overview?.totalSearches ?? 0} queries, ${((searchAnalytics?.cacheHitRate ?? 0) * 100).toFixed(0)}% cache hits`,
    },
    {
      title: 'Knowledge Base',
      count: `${(overview?.totalKnowledgeChunks ?? 0).toLocaleString()} chunks`,
      desc: 'pgvector cosine similarity embeddings',
    },
    {
      title: 'Conversations',
      count: `${overview?.totalConversations ?? 0} threads`,
      desc: 'Multi-turn 10-step RAG conversations',
    },
    {
      title: 'Background Jobs',
      count: `${jobAnalytics?.successRate ?? 100}% success`,
      desc: `${jobAnalytics?.totalJobs ?? 0} total BullMQ jobs processed`,
    },
    {
      title: 'System Health',
      count: `Health: ${healthAnalytics?.status ?? 'OPTIMAL'}`,
      desc: `${healthAnalytics?.healthScore ?? 100}% domain health index`,
    },
    {
      title: 'Active Integrations',
      count: `${overview?.activeIntegrations ?? 0} connected`,
      desc: 'GitHub OAuth webhooks & checkpoints',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Analytics & Insights Dashboard
            </h1>
            <Badge variant="ai" size="sm">
              Phase 13
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            8-domain aggregated metrics, BullMQ background jobs, and Redis caching.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">
            Aggregating workspace analytics...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domains.map((dom) => (
            <Card key={dom.title} className="p-4 space-y-2 border-slate-800 bg-[#0b101f]">
              <div className="text-xs font-semibold text-white">{dom.title}</div>
              <div className="text-xl font-bold text-blue-400 font-mono">{dom.count}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{dom.desc}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
