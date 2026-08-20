'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/store/workspace.store';
import { analyticsService } from '@/services/analytics.service';
import { repositoryService } from '@/services/repository.service';
import { githubService } from '@/services/github.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function WorkspaceDashboardPage() {
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

  // Real backend queries
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'overview'],
    queryFn: () => analyticsService.getOverview(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: repositories = [], isLoading: isReposLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: githubAccounts = [] } = useQuery({
    queryKey: ['workspace', workspaceId, 'github', 'accounts'],
    queryFn: () => githubService.listWorkspaceAccounts(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const repoCount = repositories.length;
  const chunkCount = overview?.totalKnowledgeChunks ?? 0;
  const chatCount = overview?.totalConversations ?? 0;
  const searchCount = overview?.totalSearches ?? 0;

  const isGithubConnected = githubAccounts.some((a) => a.status === 'ACTIVE');
  const isNewWorkspace = repoCount === 0 && chunkCount === 0 && chatCount === 0;

  const stats = [
    {
      title: 'Connected Repositories',
      value: repoCount.toString(),
      change:
        repoCount > 0
          ? `${repoCount} active`
          : isGithubConnected
            ? 'GitHub connected'
            : 'No repos connected',
      badge: repoCount > 0 ? 'Active' : isGithubConnected ? 'Linked' : 'Pending',
    },
    {
      title: 'Indexed Knowledge Chunks',
      value: chunkCount.toLocaleString(),
      change: chunkCount > 0 ? 'pgvector embedded' : '0 embedded',
      badge: 'pgvector',
    },
    {
      title: 'AI Conversations',
      value: chatCount.toString(),
      change: chatCount > 0 ? 'RAG grounded' : 'No chats yet',
      badge: '10-Step RAG',
    },
    {
      title: 'Search Queries',
      value: searchCount.toString(),
      change: searchCount > 0 ? 'Hybrid retrieval' : '0 queries',
      badge: 'Hybrid',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white sm:text-2xl capitalize">
              {activeWorkspace.name || slug.replace(/-/g, ' ')}
            </h1>
            <Badge
              variant={repoCount > 0 ? 'ai' : isGithubConnected ? 'success' : 'secondary'}
              size="sm"
            >
              {repoCount > 0
                ? 'RAG Active'
                : isGithubConnected
                  ? 'GitHub Linked'
                  : 'Setup Required'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Repository synchronization, hybrid search indexing, and AI conversational intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/${slug}/search`}>
            <Button variant="outline" size="sm">
              Search Code
            </Button>
          </Link>
          <Link href={`/${slug}/chat`}>
            <Button variant="ai" size="sm">
              New AI Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Empty State Card */}
      {isNewWorkspace && !isReposLoading && !isOverviewLoading && (
        <Card className="border border-blue-500/30 bg-[#080d1a] p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{isGithubConnected ? '🐙' : '🚀'}</span>
                <h3 className="text-base font-bold text-white">
                  {isGithubConnected
                    ? 'GitHub Account Linked!'
                    : 'Welcome to your AI Digital Twin!'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                {isGithubConnected
                  ? 'Your GitHub account is authorized. Head over to Repositories to synchronize your codebase and generate knowledge embeddings.'
                  : 'Connect your GitHub repository to trigger the automated 10-step indexing pipeline: AST parsing, documentation crawling, pgvector embeddings, and code-aware RAG.'}
              </p>
            </div>
            <Link href={`/${slug}/repositories`}>
              <Button variant="ai" size="sm" className="shrink-0">
                {isGithubConnected ? 'View Repositories' : 'Connect Repository'}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-4 space-y-2 border-slate-800 bg-[#0b101f]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{stat.title}</span>
              <Badge size="sm" variant="secondary" className="text-[10px] font-mono">
                {stat.badge}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {isOverviewLoading || isReposLoading ? <LoadingSpinner size="sm" /> : stat.value}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{stat.change}</div>
          </Card>
        ))}
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card interactive className="p-5 border-slate-800 bg-[#0b101f] hover:border-blue-500/50">
          <Link href={`/${slug}/chat`} className="block space-y-2">
            <div className="text-lg">🤖</div>
            <CardTitle className="text-sm text-white">Ask the Digital Twin</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Query architectural decisions, commit history, and code logic using grounded 10-step
              RAG.
            </CardDescription>
          </Link>
        </Card>

        <Card interactive className="p-5 border-slate-800 bg-[#0b101f] hover:border-blue-500/50">
          <Link href={`/${slug}/search`} className="block space-y-2">
            <div className="text-lg">🔍</div>
            <CardTitle className="text-sm text-white">Hybrid Code Search</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Search across commits, PR discussions, and symbol-aware TypeScript/JS code chunks.
            </CardDescription>
          </Link>
        </Card>

        <Card interactive className="p-5 border-slate-800 bg-[#0b101f] hover:border-blue-500/50">
          <Link href={`/${slug}/analytics`} className="block space-y-2">
            <div className="text-lg">📊</div>
            <CardTitle className="text-sm text-white">8-Domain Analytics</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Inspect AI provider costs, token usage, search latency, and BullMQ queue throughput.
            </CardDescription>
          </Link>
        </Card>
      </div>
    </div>
  );
}
