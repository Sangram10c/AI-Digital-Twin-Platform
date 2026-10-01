'use client';

import * as React from 'react';
import Image from 'next/image';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import type { ChatMessage as ChatMessageType, Citation } from '@/types/chat.types';
import type { CitationProps } from '@/components/shared/citation-badge';

interface ChatMessageProps {
  message: ChatMessageType;
  onCitationClick?: (citation: Citation) => void;
  onFileClick?: (filePath: string) => void;
  onEditPrompt?: (messageId: string, newContent: string) => void;
  userAvatar?: string | null;
  userName?: string | null;
  userFallback?: string;
}

export function ChatMessage({
  message,
  onCitationClick,
  onFileClick,
  onEditPrompt,
}: ChatMessageProps) {
  const isUser = message.role?.toLowerCase() === 'user';

  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(message.content);
  const [copied, setCopied] = React.useState(false);
  const [shared, setShared] = React.useState(false);

  const handleSaveEdit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editText.trim()) return;
    setIsEditing(false);
    onEditPrompt?.(message.id, editText.trim());
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Prompt',
          text: message.content,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(message.content);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (err) {
      console.error('Failed to share prompt:', err);
    }
  };

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

  if (isUser) {
    return (
      <div className="group flex w-full justify-end py-2.5 transition-colors">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]">
          {/* User Prompt Bubble */}
          {!isEditing ? (
            <div className="w-fit rounded-3xl px-5 py-3 sm:px-6 sm:py-3.5 text-white bg-[#173e76] shadow-sm font-sans text-sm sm:text-[14.5px] leading-relaxed break-words">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ) : (
            <form
              onSubmit={handleSaveEdit}
              className="w-full min-w-[280px] sm:min-w-[420px] rounded-2xl bg-[#173e76] border border-blue-400/40 p-3.5 shadow-xl"
            >
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditText(message.content);
                  }
                }}
                className="w-full bg-black/25 text-white placeholder-slate-400 text-sm sm:text-[14.5px] rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-300 resize-y min-h-[72px] font-sans leading-relaxed border border-white/10"
                rows={2}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(message.content);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editText.trim()}
                  className="rounded-lg bg-white text-[#173e76] px-3.5 py-1.5 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                >
                  Send
                </button>
              </div>
            </form>
          )}

          {/* Action icon buttons underneath user prompt, aligned to the right */}
          {!isEditing && (
            <div className="flex items-center justify-end gap-3 mt-1.5 px-2 text-slate-300">
              {/* Copy prompt button */}
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Copied!' : 'Copy prompt'}
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {copied ? (
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="3" ry="3" />
                    <path d="M5 15H4a2.5 2.5 0 0 1-2.5-2.5V4.5A2.5 2.5 0 0 1 4 2h8a2.5 2.5 0 0 1 2.5 2.5v1" />
                  </svg>
                )}
              </button>

              {/* Share / Export prompt button */}
              <button
                type="button"
                onClick={handleShare}
                title={shared ? 'Copied prompt to clipboard!' : 'Share prompt'}
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {shared ? (
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v6a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-6" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                )}
              </button>

              {/* Edit prompt pencil button */}
              {onEditPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setEditText(message.content);
                    setIsEditing(true);
                  }}
                  title="Edit prompt"
                  className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message Layout (Bot on Left Corner)
  return (
    <div className="group flex w-full gap-3 sm:gap-4 py-3 justify-start transition-colors">
      {/* Bot Avatar on Left Corner */}
      <div className="relative mt-1 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl overflow-hidden border border-blue-500/40 bg-gradient-to-br from-blue-950/80 to-slate-950 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/20">
        <Image
          src="/logo.png"
          alt="AI Digital Twin"
          width={36}
          height={36}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Assistant Message Bubble Container */}
      <div className="relative w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] rounded-2xl p-5 sm:p-6 text-sm sm:text-[14.5px] bg-[#0c1222]/90 border border-slate-800/80 shadow-xl ring-1 ring-white/5 transition-all">
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
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {message.error || 'Failed to complete AI response. Please try again.'}
          </div>
        )}
      </div>
    </div>
  );
}
