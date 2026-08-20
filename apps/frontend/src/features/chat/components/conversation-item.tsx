'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';
import type { Conversation } from '@/types/chat.types';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onTogglePin?: (id: string, isPinned: boolean) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState(conversation.title || 'New Conversation');

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleInput.trim() && titleInput !== conversation.title) {
      onRename?.(conversation.id, titleInput.trim());
    }
    setIsEditing(false);
  };

  const title = conversation.title || 'New Conversation';
  const repoName = conversation.repositoryName || 'All Repositories';

  return (
    <div
      onClick={() => !isEditing && onSelect(conversation.id)}
      className={cn(
        'group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all cursor-pointer select-none',
        isActive
          ? 'bg-blue-950/60 border border-blue-500/30 text-white shadow-sm'
          : 'text-slate-300 hover:bg-slate-900/60 hover:text-white border border-transparent',
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Chat Icon / Pin Indicator */}
        <span className="shrink-0 text-slate-400 group-hover:text-blue-400 transition-colors">
          {conversation.isPinned ? '📌' : '💬'}
        </span>

        {isEditing ? (
          <form
            onSubmit={handleSaveRename}
            className="flex-1 mr-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="w-full bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
            />
          </form>
        ) : (
          <div className="flex flex-col truncate flex-1">
            <span className="truncate font-medium text-xs text-white">{title}</span>
            <span className="truncate text-[10px] text-slate-400 font-mono">{repoName}</span>
          </div>
        )}
      </div>

      {/* Action Buttons on Hover */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conversation.id, Boolean(conversation.isPinned));
              }}
              title={conversation.isPinned ? 'Unpin' : 'Pin'}
              className="p-1 hover:text-amber-400 text-slate-400 transition-colors"
            >
              ★
            </button>
          )}

          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Rename"
              className="p-1 hover:text-blue-400 text-slate-400 transition-colors"
            >
              ✎
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              title="Delete"
              className="p-1 hover:text-rose-400 text-slate-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
