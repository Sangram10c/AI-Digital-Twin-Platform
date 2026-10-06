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
        {/* Chat Bubble / Pin Indicator Icon */}
        {conversation.isPinned ? (
          <span className="shrink-0 text-blue-400" title="Pinned chat">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="17" x2="12" y2="22" />
              <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7.55l-1.78.9A2 2 0 0 0 5 15.24Z" />
            </svg>
          </span>
        ) : (
          <span className="shrink-0 text-slate-400 group-hover:text-slate-200 transition-colors">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
        )}

        {isEditing ? (
          <form
            onSubmit={handleSaveRename}
            className="flex items-center gap-1.5 flex-1 min-w-0 mr-1"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setTitleInput(conversation.title || 'New Conversation');
                }
              }}
              autoFocus
              className="flex-1 min-w-0 bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              type="submit"
              title="Save rename"
              className="p-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setTitleInput(conversation.title || 'New Conversation');
              }}
              title="Cancel"
              className="p-1 rounded text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        ) : (
          <div className="flex flex-col truncate flex-1 min-w-0">
            <span className="truncate font-medium text-xs text-white">{title}</span>
            <span className="truncate text-[10px] text-slate-400 font-mono">{repoName}</span>
          </div>
        )}
      </div>

      {/* Action Buttons on Hover (ChatGPT style) */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conversation.id, Boolean(conversation.isPinned));
              }}
              title={conversation.isPinned ? 'Unpin' : 'Pin'}
              className={cn(
                'p-1.5 rounded-md transition-colors cursor-pointer',
                conversation.isPinned
                  ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80',
              )}
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill={conversation.isPinned ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="17" x2="12" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v7.55l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </svg>
            </button>
          )}

          {onRename && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setTitleInput(conversation.title || 'New Conversation');
                setIsEditing(true);
              }}
              title="Rename"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              title="Delete"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
