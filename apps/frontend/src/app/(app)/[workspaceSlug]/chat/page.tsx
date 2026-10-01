'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import { ChatShell } from '@/features/chat/components/chat-shell';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceSlug = (params?.workspaceSlug as string) || 'default';
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  // Passed from the repository-summary "Chat" button: /<slug>/chat?repositoryId=xxx
  const initialRepositoryId = searchParams?.get('repositoryId') ?? undefined;

  const activeWorkspace = currentWorkspace ||
    workspaces.find((w) => w.slug === workspaceSlug) || {
      id: 'default',
      name: 'Primary Workspace',
      slug: workspaceSlug,
    };

  if (!activeWorkspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ChatShell
      workspaceId={activeWorkspace.id}
      workspaceSlug={workspaceSlug}
      initialRepositoryId={initialRepositoryId}
    />
  );
}
