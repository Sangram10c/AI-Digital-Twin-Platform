'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { chatService } from '@/services/chat.service';
import { githubService } from '@/services/github.service';
import type { Repository } from '@/services/repository.service';
import { useChatStream } from '../hooks/use-chat-stream';
import { ConversationSidebar } from './conversation-sidebar';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';
import { CitationDrawer } from './citation-drawer';
import { FilePreviewModal } from './file-preview-modal';
import { NewChatModal } from './new-chat-modal';
import type { AIProvider, Citation } from '@/types/chat.types';

interface ChatShellProps {
  workspaceId: string;
  workspaceSlug: string;
  initialConversationId?: string;
}

export function ChatShell({ workspaceId, workspaceSlug, initialConversationId }: ChatShellProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null);
  const [customProvider, setCustomProvider] = React.useState<AIProvider | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = React.useState(false);
  const [selectedCitation, setSelectedCitation] = React.useState<Citation | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = React.useState<{
    filePath: string;
    citation?: Citation | null;
  } | null>(null);

  const activeConversationId = initialConversationId;

  // Query connected GitHub accounts for current workspace to fetch GitHub avatar
  const { data: githubAccounts } = useQuery({
    queryKey: ['github', 'accounts', workspaceId],
    queryFn: () => githubService.listWorkspaceAccounts(workspaceId),
    enabled: Boolean(workspaceId && workspaceId !== 'default'),
  });

  const githubAvatar =
    githubAccounts?.find((a) => a.status === 'ACTIVE')?.providerMetadata?.avatarUrl ||
    (githubAccounts?.[0]?.providerUsername
      ? `https://github.com/${githubAccounts[0].providerUsername}.png`
      : null);

  const userAvatar = user?.avatar || githubAvatar || null;
  const userName = user?.displayName || user?.firstName || 'Developer';
  const userFallback =
    user?.displayName?.slice(0, 2).toUpperCase() ||
    user?.firstName?.slice(0, 2).toUpperCase() ||
    (user?.email ? user.email.slice(0, 2).toUpperCase() : 'ME');

  // Fetch full conversation history from backend
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return null;
      return chatService.getConversation(activeConversationId);
    },
    enabled: Boolean(activeConversationId),
  });

  const initialMessages = React.useMemo(() => {
    if (!conversationData?.messages) return [];
    return conversationData.messages.map((m) => ({
      id: m.id,
      role: (m.role?.toLowerCase() === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
      sequenceNumber: m.sequenceNumber,
      tokenCount: m.tokenCount,
      createdAt:
        typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
    }));
  }, [conversationData]);

  // Derive active provider without cascading effect setState
  const selectedProvider: AIProvider =
    customProvider || (conversationData?.aiProvider?.toLowerCase() as AIProvider) || 'gemini';

  const { messages, isStreaming, sendMessage, stopGeneration } = useChatStream({
    workspaceId,
    conversationId: activeConversationId,
    repositoryId: selectedRepo?.id,
    provider: selectedProvider,
    initialMessages,
    onConversationCreated: (newId) => {
      router.replace(`/${workspaceSlug}/chat/${newId}`);
    },
  });

  const handleStartNewChat = (repo: Repository | null) => {
    setSelectedRepo(repo);
    setIsNewChatModalOpen(false);
    router.push(`/${workspaceSlug}/chat`);
  };

  const handleFileClick = (filePath: string) => {
    // Check if there is a matching citation for this file path in the current messages
    const allCitations: Citation[] = messages.flatMap((m) => m.citations || []);
    const matchingCitation = allCitations.find(
      (c) =>
        c.filePath === filePath ||
        c.filePath?.endsWith(filePath) ||
        filePath.endsWith(c.filePath || ''),
    );

    setSelectedFilePreview({
      filePath,
      citation: matchingCitation || null,
    });
  };

  const currentTitle =
    conversationData?.title || (selectedRepo ? selectedRepo.name : 'AI Digital Twin');
  const currentRepoName = conversationData?.repositoryName || selectedRepo?.name;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#030712]">
      {/* Left Sidebar */}
      <ConversationSidebar
        workspaceId={workspaceId}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => router.push(`/${workspaceSlug}/chat/${id}`)}
        onNewChat={() => setIsNewChatModalOpen(true)}
        className={
          isSidebarOpen ? 'fixed inset-y-0 left-0 z-40 flex shadow-2xl md:static' : 'hidden md:flex'
        }
      />

      {/* Main Chat Pane */}
      <main className="flex flex-1 flex-col h-full min-w-0 bg-[#030712] relative overflow-hidden">
        {/* Chat Header */}
        <ChatHeader
          title={currentTitle}
          repositoryName={currentRepoName}
          isPinned={conversationData?.isPinned}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onRename={async (newTitle) => {
            if (activeConversationId) {
              await chatService.updateTitle(activeConversationId, newTitle);
            }
          }}
          onTogglePin={async () => {
            if (activeConversationId) {
              if (conversationData?.isPinned) {
                await chatService.unpinConversation(activeConversationId);
              } else {
                await chatService.pinConversation(activeConversationId);
              }
            }
          }}
        />

        {/* Message Stream List */}
        <MessageList
          messages={messages}
          repositoryName={currentRepoName}
          onSelectPrompt={(prompt) => sendMessage(prompt, selectedProvider)}
          onCitationClick={(citation) => setSelectedCitation(citation)}
          onFileClick={handleFileClick}
          userAvatar={userAvatar}
          userName={userName}
          userFallback={userFallback}
        />

        {/* Message Composer */}
        <MessageComposer
          onSend={(text, prov) => sendMessage(text, prov)}
          onStop={stopGeneration}
          isStreaming={isStreaming}
          selectedProvider={selectedProvider}
          onSelectProvider={setCustomProvider}
        />
      </main>

      {/* New Chat Modal */}
      <NewChatModal
        open={isNewChatModalOpen}
        onOpenChange={setIsNewChatModalOpen}
        workspaceId={workspaceId}
        onStartChat={handleStartNewChat}
      />

      {/* Citation Details Drawer */}
      <CitationDrawer
        citation={selectedCitation}
        open={Boolean(selectedCitation)}
        onOpenChange={(open) => {
          if (!open) setSelectedCitation(null);
        }}
      />

      {/* File Code Preview Popup Modal */}
      <FilePreviewModal
        open={Boolean(selectedFilePreview)}
        onOpenChange={(open) => {
          if (!open) setSelectedFilePreview(null);
        }}
        filePath={selectedFilePreview?.filePath || null}
        citation={selectedFilePreview?.citation}
        allCitations={messages.flatMap((m) => m.citations || [])}
        repositoryName={currentRepoName}
        workspaceId={workspaceId}
      />
    </div>
  );
}
