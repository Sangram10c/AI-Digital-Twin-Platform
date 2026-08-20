'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';
import { repositoryService } from '@/services/repository.service';
import { chatService } from '@/services/chat.service';
import { githubService } from '@/services/github.service';

export function useDashboard(workspaceId: string) {
  const isEnabled = Boolean(workspaceId && workspaceId !== 'default');

  // Overview KPIs
  const overviewQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'overview'],
    queryFn: () => analyticsService.getOverview(workspaceId),
    enabled: isEnabled,
    staleTime: 30000,
  });

  // Repositories
  const repositoriesQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: isEnabled,
    staleTime: 30000,
  });

  // System & Domain Health
  const healthQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'health'],
    queryFn: () => analyticsService.getHealth(workspaceId),
    enabled: isEnabled,
    staleTime: 30000,
  });

  // Recent Conversations
  const conversationsQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'chat', 'recent-conversations'],
    queryFn: () => chatService.listConversations(workspaceId, 1, 5),
    enabled: isEnabled,
    staleTime: 30000,
  });

  // Connected GitHub Accounts
  const githubQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'github', 'accounts'],
    queryFn: () => githubService.listWorkspaceAccounts(workspaceId),
    enabled: isEnabled,
    staleTime: 30000,
  });

  // AI Analytics Summary
  const aiQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'ai'],
    queryFn: () => analyticsService.getAi(workspaceId),
    enabled: isEnabled,
    staleTime: 60000,
  });

  // Search Analytics Summary
  const searchQuery = useQuery({
    queryKey: ['workspace', workspaceId, 'analytics', 'search'],
    queryFn: () => analyticsService.getSearch(workspaceId),
    enabled: isEnabled,
    staleTime: 60000,
  });

  const isLoading = overviewQuery.isLoading || repositoriesQuery.isLoading || healthQuery.isLoading;

  return {
    overview: overviewQuery.data,
    repositories: repositoriesQuery.data || [],
    health: healthQuery.data,
    conversations: conversationsQuery.data?.data || [],
    githubAccounts: githubQuery.data || [],
    aiSummary: aiQuery.data,
    searchSummary: searchQuery.data,
    isLoading,
    isOverviewLoading: overviewQuery.isLoading,
    isReposLoading: repositoriesQuery.isLoading,
    isHealthLoading: healthQuery.isLoading,
    isConversationsLoading: conversationsQuery.isLoading,
    isError: overviewQuery.isError || repositoriesQuery.isError,
    refetchAll: () => {
      overviewQuery.refetch();
      repositoriesQuery.refetch();
      healthQuery.refetch();
      conversationsQuery.refetch();
    },
  };
}
