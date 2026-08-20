'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/store/workspace.store';
import { analyticsService } from '@/services/analytics.service';
import { repositoryService } from '@/services/repository.service';
import {
  AnalyticsHeader,
  AnalyticsKpiGrid,
  AnalyticsDomainCards,
  AnalyticsSkeleton,
  TimeRangeFilter,
} from '@/features/analytics';
import { ErrorState } from '@/components/shared/error-state';

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

  const [timeRange, setTimeRange] = React.useState<TimeRangeFilter>('30d');
  const [selectedRepoId, setSelectedRepoId] = React.useState<string>('ALL');

  // Repositories query for repo scope dropdown
  const { data: repositories = [] } = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Overview KPIs
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    isFetching: isOverviewFetching,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'overview', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getOverview(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Repository Git analytics
  const { data: repoAnalytics, refetch: refetchRepo } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'repositories', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Knowledge analytics
  const { data: knowledgeAnalytics, refetch: refetchKnowledge } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'knowledge', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getKnowledge(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Search analytics
  const { data: searchAnalytics, refetch: refetchSearch } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'search', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getSearch(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // AI Inference analytics
  const { data: aiAnalytics, refetch: refetchAi } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'ai', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getAi(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Conversations analytics
  const { data: convAnalytics, refetch: refetchConv } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'conversations', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getConversations(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // BullMQ Job analytics
  const { data: jobAnalytics, refetch: refetchJobs } = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'jobs', timeRange, selectedRepoId],
    queryFn: () => analyticsService.getJobs(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const handleRefreshAll = () => {
    refetchOverview();
    refetchRepo();
    refetchKnowledge();
    refetchSearch();
    refetchAi();
    refetchConv();
    refetchJobs();
  };

  if (isOverviewLoading && !overview) {
    return <AnalyticsSkeleton />;
  }

  if (isOverviewError) {
    return (
      <ErrorState
        title="Failed to Load Workspace Analytics"
        description="Unable to fetch telemetry metrics from the Phase 13 analytics aggregator. Please check connectivity and retry."
        onRetry={handleRefreshAll}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* 1. Header with Time Range & Repo Filter */}
      <AnalyticsHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedRepoId={selectedRepoId}
        onRepoChange={setSelectedRepoId}
        repositories={repositories}
        isRefetching={isOverviewFetching}
        onRefresh={handleRefreshAll}
      />

      {/* 2. Top-Level Metric KPI Grid */}
      <AnalyticsKpiGrid
        overview={overview}
        ai={aiAnalytics}
        search={searchAnalytics}
        jobs={jobAnalytics}
      />

      {/* 3. Deep Domain Analytics Breakdown Cards */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
          Domain Telemetry & Breakdown
        </h2>

        <AnalyticsDomainCards
          repository={repoAnalytics}
          knowledge={knowledgeAnalytics}
          search={searchAnalytics}
          ai={aiAnalytics}
          conversations={convAnalytics}
          jobs={jobAnalytics}
        />
      </div>
    </div>
  );
}
