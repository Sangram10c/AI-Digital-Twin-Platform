'use client';

import Image from 'next/image';
import { Avatar } from '@/components/ui/avatar';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { cn } from '@/utils/cn';
import type { ChatMessage as ChatMessageType, Citation } from '@/types/chat.types';
import type { CitationProps } from '@/components/shared/citation-badge';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
  onFileClick?: (filePath: string) => void;
  userAvatar?: string | null;
  userName?: string | null;
  userFallback?: string;
}

export function ChatMessage({
  message,
  onCitationClick,
  onFileClick,
  userAvatar,
  userName,
  userFallback = 'ME',
}: ChatMessageProps) {
  const isUser = message.role?.toLowerCase() === 'user';
  const isAssistant = message.role?.toLowerCase() === 'assistant' || !isUser;

  // Map backend citations into MarkdownRenderer format
  const mappedCitations: CitationProps[] = (message.citations || []).map((c) => ({
    number: c.index,
    sourceType: (c.filePath?.includes('/')
      ? 'FILE'
      : 'DOCUMENTATION') as CitationProps['sourceType'],
    title: c.title || c.filePath || 'Source',
    path: c.filePath || undefined,
    excerpt: c.excerpt,
    relevanceScore: c.relevanceScore,
  }));

  return (
    <div
      className={cn(
        'flex w-full gap-3.5 py-2 transition-colors',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Bot Avatar on Left Corner (Assistant Only) */}
      {!isUser && (
        <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-blue-500/40 bg-gradient-to-br from-blue-950/80 to-slate-950 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20">
          <Image
            src="/logo.png"
            alt="AI Digital Twin"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Message Bubble Container */}
      <div
        className={cn(
          'relative max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] transition-all',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-600/10'
            : 'bg-[#0b101f] text-slate-200 border border-slate-800/90 rounded-tl-xs shadow-xl ring-1 ring-white/5',
        )}
      >
        {isAssistant ? (
          <div>
            {message.content ? (
              <MarkdownRenderer
                content={message.content}
                citations={mappedCitations}
                onCitationClick={(c) => {
                  const raw = (message.citations || []).find((rawC) => rawC.index === c.number);
                  if (raw) onCitationClick?.(raw);
                }}
                onFileClick={onFileClick}
              />
            ) : message.isStreaming ? (
              <div className="flex items-center gap-2.5 text-slate-300 py-1 font-mono text-xs">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                <span>Generating grounded answer with repository citations...</span>
              </div>
            ) : null}

            {/* Error Display */}
            {message.status === 'error' && (
              <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2.5 text-xs text-rose-300">
                {message.error || 'Failed to complete AI response. Please try again.'}
              </div>
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed text-white break-words">
            {message.content}
          </div>
        )}
      </div>

      {/* User Avatar on Right Corner (User Only) */}
      {isUser && (
        <Avatar
          src={userAvatar}
          alt={userName || 'User'}
          fallback={userFallback}
          size="md"
          className="mt-0.5 shrink-0 ring-1 ring-white/20 shadow-md"
        />
      )}
    </div>
  );
}
