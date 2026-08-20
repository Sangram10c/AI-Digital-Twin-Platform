'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { ConversationItem } from './conversation-item';
import { useConversations } from '../hooks/use-conversations';
import type { Conversation } from '@/types/chat.types';

interface ConversationSidebarProps {
  workspaceId: string;
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function ConversationSidebar({
  workspaceId,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  className,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const {
    groupedConversations,
    isLoading,
    deleteConversation,
    renameConversation,
    togglePinConversation,
  } = useConversations(workspaceId, searchQuery);

  const hasAnyConversations =
    groupedConversations.today.length > 0 ||
    groupedConversations.yesterday.length > 0 ||
    groupedConversations.previous7Days.length > 0 ||
    groupedConversations.older.length > 0;

  const renderGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;

    return (
      <div key={title} className="space-y-1">
        <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
          {title}
        </h4>
        <div className="space-y-0.5">
          {list.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onSelect={onSelectConversation}
              onDelete={(id) => deleteConversation(id)}
              onRename={(id, title) => renameConversation({ id, title })}
              onTogglePin={(id, isPinned) => togglePinConversation({ id, isPinned })}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`flex flex-col h-full w-full bg-[#080d1a] border-r border-slate-800/80 select-none ${className || ''}`}
    >
      {/* Header with New Chat Button */}
      <div className="p-3 border-b border-slate-800/80 space-y-2.5">
        <Button
          onClick={onNewChat}
          variant="ai"
          size="sm"
          className="w-full flex items-center justify-center gap-2 text-xs font-semibold shadow-md"
        >
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
          <span>New Chat</span>
        </Button>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 bg-slate-900/80 border-slate-800 focus:border-blue-500 text-white text-xs pl-8 pr-2"
          />
          <svg
            className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Conversation List / Groups */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-2">
            <LoadingSpinner size="sm" />
            <span className="text-[10px] text-slate-400 font-mono">Loading history...</span>
          </div>
        ) : !hasAnyConversations ? (
          <div className="text-center p-6 space-y-2">
            <span className="text-2xl">💬</span>
            <p className="text-xs text-slate-400 font-medium">No conversations found</p>
            <p className="text-[11px] text-slate-400">Click &ldquo;New Chat&rdquo; to begin.</p>
          </div>
        ) : (
          <>
            {renderGroup('Today', groupedConversations.today)}
            {renderGroup('Yesterday', groupedConversations.yesterday)}
            {renderGroup('Previous 7 Days', groupedConversations.previous7Days)}
            {renderGroup('Older', groupedConversations.older)}
          </>
        )}
      </div>
    </aside>
  );
}
