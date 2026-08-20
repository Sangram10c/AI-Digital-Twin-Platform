'use client';

import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import {
  DashboardHeader,
  MetricGrid,
  RepositorySummary,
  RepositoryHealth,
  RecentConversations,
  AiSearchSummary,
  EmptyDashboard,
  DashboardSkeleton,
  useDashboard,
} from '@/features/dashboard';
import { ErrorState } from '@/components/shared/error-state';

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const slug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === slug) || {
      id: 'default',
      name: slug,
      slug,
      role: 'MEMBER',
    };

  const workspaceId = activeWorkspace.id;

  const {
    overview,
    repositories,
    health,
    conversations,
    githubAccounts,
    aiSummary,
    searchSummary,
    isLoading,
    isError,
    refetchAll,
  } = useDashboard(workspaceId);

  const hasRepositories = repositories.length > 0;
  const isGithubConnected = githubAccounts.some((a) => a.status === 'ACTIVE');
  const isBrandNewWorkspace = !hasRepositories && conversations.length === 0;

  if (isLoading && !overview) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load workspace dashboard"
        description="Failed to fetch real-time workspace analytics and repository data. Please check your network connection."
        onRetry={refetchAll}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* 1. Header with Personalized Greeting & Quick Actions */}
      <DashboardHeader
        workspace={activeWorkspace}
        hasRepositories={hasRepositories}
        isGithubConnected={isGithubConnected}
      />

      {/* 2. Key Metrics Grid */}
      <MetricGrid overview={overview} repoCount={repositories.length} slug={slug} />

      {/* 3. Empty Workspace Onboarding Guide (if 0 repos) */}
      {isBrandNewWorkspace && (
        <EmptyDashboard
          slug={slug}
          workspaceName={activeWorkspace.name}
          isGithubConnected={isGithubConnected}
        />
      )}

      {/* 4. Active Workspace Intelligence Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Primary Column: Repositories + Conversations */}
        <div className="lg:col-span-2 space-y-6">
          <RepositorySummary repositories={repositories} slug={slug} />

          <RecentConversations conversations={conversations} slug={slug} />
        </div>

        {/* Right Secondary Column: System Health + Telemetry */}
        <div className="space-y-6">
          <RepositoryHealth health={health} />

          <AiSearchSummary aiSummary={aiSummary} searchSummary={searchSummary} />
        </div>
      </div>
    </div>
  );
}
