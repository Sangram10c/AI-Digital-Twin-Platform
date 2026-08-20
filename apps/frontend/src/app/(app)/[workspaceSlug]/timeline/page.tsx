'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspace.store';
import { repositoryService } from '@/services/repository.service';
import { chatService } from '@/services/chat.service';
import { TimelineItem, TimelineSkeleton, TimelineEvent } from '@/features/timeline';

export default function TimelinePage() {
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

  const [activeFilter, setActiveFilter] = React.useState<string>('ALL');
  const [selectedRepoId, setSelectedRepoId] = React.useState<string>('ALL');

  // Real repositories query
  const { data: repositories = [], isLoading: isReposLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  // Real conversations query
  const { data: convResponse, isLoading: isChatsLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'conversations'],
    queryFn: () => chatService.listConversations(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const conversations = React.useMemo(() => convResponse?.data || [], [convResponse]);
  const isLoading = isReposLoading || isChatsLoading;

  // Derive chronological events from real backend data
  const events: TimelineEvent[] = React.useMemo(() => {
    const list: TimelineEvent[] = [];

    repositories.forEach((repo) => {
      if (repo.lastSyncedAt) {
        list.push({
          id: `sync-${repo.id}`,
          date: new Date(repo.lastSyncedAt).toLocaleString(),
          type: 'REPOSITORY_SYNC',
          title: `Repository Synchronized: ${repo.name}`,
          description: `Full AST extraction and pgvector embeddings generated for ${repo.commitsCount ?? 0} commits on branch ${repo.defaultBranch || 'main'}.`,
          author: repo.owner || 'System Worker',
          repositoryName: repo.name,
          badgeText: 'Sync Complete',
        });
      }

      if (repo.commitsCount && repo.commitsCount > 0) {
        list.push({
          id: `commit-${repo.id}`,
          date: repo.updatedAt ? new Date(repo.updatedAt).toLocaleString() : 'Recent',
          type: 'COMMIT',
          title: `Codebase Commits Synced`,
          description: `Tracked ${repo.commitsCount} commits across branch ${repo.defaultBranch || 'main'}.`,
          author: repo.owner || 'GitHub Webhook',
          repositoryName: repo.name,
          badgeText: `${repo.commitsCount} Commits`,
        });
      }

      if (repo.pullRequestsCount && repo.pullRequestsCount > 0) {
        list.push({
          id: `pr-${repo.id}`,
          date: repo.updatedAt ? new Date(repo.updatedAt).toLocaleString() : 'Recent',
          type: 'PULL_REQUEST',
          title: `Pull Request Intelligence Indexed`,
          description: `Processed metadata and discussions for ${repo.pullRequestsCount} pull requests.`,
          author: repo.owner || 'GitHub API',
          repositoryName: repo.name,
          badgeText: `${repo.pullRequestsCount} PRs`,
        });
      }
    });

    conversations.forEach((conv) => {
      list.push({
        id: `chat-${conv.id}`,
        date: new Date(conv.createdAt).toLocaleString(),
        type: 'AI_CONVERSATION',
        title: conv.title || 'AI RAG Session',
        description: `Grounded twin conversation created with ${conv.messageCount} messages.`,
        author: 'Developer',
        repositoryName: conv.repositoryName || 'Workspace',
        badgeText: `${conv.messageCount} Messages`,
      });
    });

    return list;
  }, [repositories, conversations]);

  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      if (activeFilter !== 'ALL' && e.type !== activeFilter) return false;
      if (selectedRepoId !== 'ALL' && e.repositoryName !== selectedRepoId) return false;
      return true;
    });
  }, [events, activeFilter, selectedRepoId]);

  const repoOptions = [
    { value: 'ALL', label: 'All Repositories' },
    ...repositories.map((r) => ({
      value: r.name,
      label: r.name,
    })),
  ];

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* 1. Header */}
      <div className="space-y-1 pb-4 border-b border-slate-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Engineering Activity Timeline
        </h1>
        <p className="text-xs text-slate-400">
          Chronological audit trail of repository synchronizations, commits, pull requests, and AI
          RAG sessions.
        </p>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="bg-slate-900 border border-slate-800 h-8 p-0.5 rounded-lg">
            <TabsTrigger value="ALL" className="text-xs px-3 h-7">
              All Activity
            </TabsTrigger>
            <TabsTrigger value="REPOSITORY_SYNC" className="text-xs px-3 h-7">
              Syncs
            </TabsTrigger>
            <TabsTrigger value="AI_CONVERSATION" className="text-xs px-3 h-7">
              AI Chats
            </TabsTrigger>
            <TabsTrigger value="COMMIT" className="text-xs px-3 h-7">
              Commits
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {repositories.length > 0 && (
          <div className="w-48">
            <Select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              options={repoOptions}
              className="h-8 text-xs bg-slate-900 border-slate-800"
            />
          </div>
        )}
      </div>

      {/* 3. Timeline Items / Empty State */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : filteredEvents.length === 0 ? (
        <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-center text-4xl">⏱️</div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No activity events recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Activity timeline will populate automatically as repositories are synchronized and AI
              conversations take place.
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative border-l border-slate-800/80 ml-3.5 space-y-6">
          {filteredEvents.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
