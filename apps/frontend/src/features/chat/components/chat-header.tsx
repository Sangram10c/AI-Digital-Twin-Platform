'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  title?: string | null;
  repositoryName?: string | null;
  isPinned?: boolean;
  onToggleSidebar?: () => void;
  onRename?: (newTitle: string) => void;
  onTogglePin?: () => void;
}

export function ChatHeader({
  title = 'AI Conversation',
  repositoryName,
  isPinned = false,
  onToggleSidebar,
  onRename,
  onTogglePin,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [customTitle, setCustomTitle] = React.useState<string | null>(null);

  const displayTitle = customTitle ?? title ?? 'New Conversation';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayTitle.trim() && displayTitle !== title) {
      onRename?.(displayTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-[#080d1a]/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3 min-w-0">
        {/* Toggle Sidebar Button on Mobile/Tablet */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleSidebar}
          className="h-8 w-8 p-0 lg:hidden text-slate-300"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" x2="21" y1="6" y2="6" />
            <line x1="3" x2="21" y1="12" y2="12" />
            <line x1="3" x2="21" y1="18" y2="18" />
          </svg>
        </Button>

        {/* Repository Scope & Title */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm" className="font-mono text-[9px] px-1.5 py-0">
              📦 {repositoryName || 'All Repositories'}
            </Badge>
            {isPinned && <span title="Pinned">📌</span>}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="flex items-center gap-1.5 mt-0.5">
              <input
                type="text"
                value={displayTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onBlur={() => setIsEditing(false)}
                autoFocus
                className="bg-slate-900 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-white outline-none"
              />
            </form>
          ) : (
            <h1
              onClick={() => {
                setCustomTitle(displayTitle);
                setIsEditing(true);
              }}
              className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-blue-400 transition-colors"
              title="Click to rename"
            >
              {displayTitle}
            </h1>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5">
        {onTogglePin && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTogglePin}
            className={`h-7 px-2 text-xs ${isPinned ? 'text-amber-400 border-amber-500/30' : 'text-slate-400'}`}
          >
            {isPinned ? '★ Pinned' : '☆ Pin'}
          </Button>
        )}
      </div>
    </header>
  );
}
