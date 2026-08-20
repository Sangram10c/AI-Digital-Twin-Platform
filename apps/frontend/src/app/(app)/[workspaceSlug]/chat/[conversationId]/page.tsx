'use client';

import { useParams } from 'next/navigation';
import { useWorkspaceStore } from '@/store/workspace.store';
import { ChatShell } from '@/features/chat/components/chat-shell';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export default function ConversationDetailPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspaceSlug as string) || 'default';
  const conversationId = params?.conversationId as string;
  const { currentWorkspace, workspaces } = useWorkspaceStore();

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
      initialConversationId={conversationId}
    />
  );
}
