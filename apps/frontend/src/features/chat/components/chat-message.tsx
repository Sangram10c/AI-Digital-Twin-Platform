'use client';

import { Avatar } from '@/components/ui/avatar';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { cn } from '@/utils/cn';
import type { ChatMessage as ChatMessageType, Citation } from '@/types/chat.types';
import type { CitationProps } from '@/components/shared/citation-badge';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
}

export function ChatMessage({ message, onCitationClick }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

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
        'flex w-full gap-3 py-3 px-4 transition-colors',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <Avatar
          fallback="AI"
          size="sm"
          className="mt-0.5 h-7 w-7 shrink-0 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold"
        />
      )}

      <div
        className={cn(
          'relative max-w-2xl rounded-2xl p-4 text-xs transition-all',
          isUser
            ? 'bg-blue-600 text-white rounded-br-xs shadow-md'
            : 'bg-[#0b101f] text-slate-200 border border-slate-800/90 rounded-bl-xs shadow-lg ring-1 ring-white/5',
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
              />
            ) : message.isStreaming ? (
              <div className="flex items-center gap-2 text-slate-400 py-1 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                <span>Generating grounded answer with repository citations...</span>
              </div>
            ) : null}

            {/* Error Display */}
            {message.status === 'error' && (
              <div className="mt-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-2 text-[11px] text-rose-300">
                {message.error || 'Failed to complete AI response. Please try again.'}
              </div>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed text-white">{message.content}</p>
        )}
      </div>

      {isUser && (
        <Avatar
          fallback="ME"
          size="sm"
          className="mt-0.5 h-7 w-7 shrink-0 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold"
        />
      )}
    </div>
  );
}
