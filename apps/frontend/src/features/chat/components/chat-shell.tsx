'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ConversationSidebar } from './conversation-sidebar';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';
import { CitationDrawer } from './citation-drawer';
import { NewChatModal } from './new-chat-modal';
import { useChatStream } from '../hooks/use-chat-stream';
import { chatService } from '@/services/chat.service';
import type { Citation, AIProvider } from '@/types/chat.types';
import type { Repository } from '@/services/repository.service';

interface ChatShellProps {
  workspaceId: string;
  workspaceSlug: string;
  initialConversationId?: string;
}

export function ChatShell({ workspaceId, workspaceSlug, initialConversationId }: ChatShellProps) {
  const router = useRouter();

  const [selectedRepo, setSelectedRepo] = React.useState<Repository | null>(null);
  const [selectedProvider, setSelectedProvider] = React.useState<AIProvider>('gemini');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = React.useState(false);
  const [selectedCitation, setSelectedCitation] = React.useState<Citation | null>(null);

  const activeConversationId = initialConversationId;

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
      role: m.role as 'user' | 'assistant',
      content: m.content,
      sequenceNumber: m.sequenceNumber,
      tokenCount: m.tokenCount,
      createdAt:
        typeof m.createdAt === 'string' ? m.createdAt : new Date(m.createdAt).toISOString(),
    }));
  }, [conversationData]);

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

  const handleSelectConversation = (id: string) => {
    setIsSidebarOpen(false);
    router.push(`/${workspaceSlug}/chat/${id}`);
  };

  const handleStartNewChat = (repo: Repository | null) => {
    setSelectedRepo(repo);
    setIsSidebarOpen(false);
    router.push(`/${workspaceSlug}/chat`);
  };

  const currentTitle =
    conversationData?.title ||
    (selectedRepo ? `Chat with ${selectedRepo.name}` : 'New AI Conversation');
  const currentRepoName =
    selectedRepo?.name || conversationData?.repositoryName || 'All Repositories';

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#050811]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 h-full shrink-0">
        <ConversationSidebar
          workspaceId={workspaceId}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={() => setIsNewChatModalOpen(true)}
        />
      </div>

      {/* Mobile / Tablet Drawer Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative z-50 w-72 h-full bg-[#080d1a] shadow-2xl">
            <ConversationSidebar
              workspaceId={workspaceId}
              activeConversationId={activeConversationId}
              onSelectConversation={handleSelectConversation}
              onNewChat={() => {
                setIsSidebarOpen(false);
                setIsNewChatModalOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Chat Content Area */}
      <main className="flex flex-1 flex-col h-full min-w-0 bg-[#050811]">
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
        />

        {/* Message Composer */}
        <MessageComposer
          onSend={(text, prov) => sendMessage(text, prov)}
          onStop={stopGeneration}
          isStreaming={isStreaming}
          selectedProvider={selectedProvider}
          onSelectProvider={setSelectedProvider}
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
    </div>
  );
}
