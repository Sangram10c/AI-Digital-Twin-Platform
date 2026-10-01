'use client';

import * as React from 'react';
import { ChatMessage } from './chat-message';
import { ChatEmptyState } from './chat-empty-state';
import type { ChatMessage as ChatMessageType, Citation } from '@/types/chat.types';

interface MessageListProps {
  messages: ChatMessageType[];
  repositoryName?: string | null;
  onSelectPrompt: (prompt: string) => void;
  onCitationClick: (citation: Citation) => void;
  onFileClick?: (filePath: string) => void;
  onEditPrompt?: (messageId: string, newContent: string) => void;
  userAvatar?: string | null;
  userName?: string | null;
  userFallback?: string;
}

export function MessageList({
  messages,
  repositoryName,
  onSelectPrompt,
  onCitationClick,
  onFileClick,
  onEditPrompt,
  userAvatar,
  userName,
  userFallback,
}: MessageListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll ONLY this inner container on message change
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        <ChatEmptyState repositoryName={repositoryName} onSelectPrompt={onSelectPrompt} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto w-full px-4 sm:px-6 py-4 space-y-4 overscroll-contain"
    >
      <div className="w-full space-y-4">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onCitationClick={onCitationClick}
            onFileClick={onFileClick}
            onEditPrompt={onEditPrompt}
            userAvatar={userAvatar}
            userName={userName}
            userFallback={userFallback}
          />
        ))}
      </div>
    </div>
  );
}
