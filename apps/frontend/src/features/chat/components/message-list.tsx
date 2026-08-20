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
}

export function MessageList({
  messages,
  repositoryName,
  onSelectPrompt,
  onCitationClick,
}: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
        <ChatEmptyState repositoryName={repositoryName} onSelectPrompt={onSelectPrompt} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} onCitationClick={onCitationClick} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
