'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkspaceStore } from '@/store/workspace.store';
import { repositoryService } from '@/services/repository.service';
import { chatService } from '@/services/chat.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

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

  const { data: repositories = [], isLoading: isReposLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'repositories'],
    queryFn: () => repositoryService.getRepositories(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const { data: convResponse, isLoading: isChatsLoading } = useQuery({
    queryKey: ['workspace', workspaceId, 'conversations'],
    queryFn: () => chatService.listConversations(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const conversations = convResponse?.data || [];
  const isLoading = isReposLoading || isChatsLoading;

  // Derive real timeline events from connected repositories and conversation creations
  const events: Array<{
    date: string;
    type: string;
    title: string;
    description: string;
    author: string;
  }> = [];

  repositories.forEach((repo) => {
    if (repo.lastSyncedAt) {
      events.push({
        date: new Date(repo.lastSyncedAt).toLocaleDateString(),
        type: 'REPOSITORY_SYNC',
        title: `Repository Synchronized: ${repo.name}`,
        description: `Synchronized ${repo.commitsCount ?? 0} commits and ${repo.pullRequestsCount ?? 0} PRs on branch ${repo.defaultBranch || 'main'}.`,
        author: repo.owner || 'System',
      });
    }
  });

  conversations.forEach((conv) => {
    events.push({
      date: new Date(conv.createdAt).toLocaleDateString(),
      type: 'AI_CONVERSATION',
      title: conv.title || 'AI RAG Conversation',
      description: `Grounded AI chat thread created with ${conv.messageCount} messages.`,
      author: 'Developer',
    });
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-xl font-bold text-white sm:text-2xl">Engineering Timeline</h1>
        <p className="text-xs text-slate-400">
          Chronological time-series of repository commits, PR merges, architectural milestones, and
          sync events.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading activity timeline...</span>
        </div>
      ) : events.length === 0 ? (
        <Card className="border border-slate-800 bg-[#0b101f] p-12 text-center rounded-2xl shadow-xl space-y-4">
          <div className="flex justify-center text-4xl">⏱️</div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No engineering events recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Activity timeline will populate automatically as repositories are synchronized and AI
              conversations take place.
            </p>
          </div>
        </Card>
      ) : (
        <div className="relative border-l border-slate-800 ml-4 space-y-6 pl-6">
          {events.map((event, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-[#050811] bg-blue-500" />
              <Card className="p-4 space-y-1.5 border-slate-800 bg-[#0b101f]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 text-[10px]">{event.date}</span>
                  <Badge size="sm" variant="secondary" className="font-mono text-[9px]">
                    {event.type}
                  </Badge>
                </div>
                <CardTitle className="text-sm text-white">{event.title}</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {event.description}
                </CardDescription>
                <div className="text-[10px] text-slate-400 pt-1 font-mono">By {event.author}</div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
