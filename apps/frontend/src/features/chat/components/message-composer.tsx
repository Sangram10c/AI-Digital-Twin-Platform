'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './model-selector';
import type { AIProvider } from '@/types/chat.types';

interface MessageComposerProps {
  onSend: (message: string, provider: AIProvider) => void;
  onStop: () => void;
  isStreaming: boolean;
  selectedProvider: AIProvider;
  onSelectProvider: (provider: AIProvider) => void;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  onStop,
  isStreaming,
  selectedProvider,
  onSelectProvider,
  disabled = false,
}: MessageComposerProps) {
  const [input, setInput] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;

    onSend(input.trim(), selectedProvider);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-[#080d1a]/90 border-t border-slate-800/80 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex flex-col gap-2">
        {/* Input Textarea Container */}
        <div className="relative flex items-end rounded-2xl border border-slate-800 bg-[#0b101f] shadow-xl ring-1 ring-white/5 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your project, architecture, commits, or code..."
            disabled={disabled}
            className="w-full resize-none bg-transparent py-3 pl-4 pr-24 text-xs text-white placeholder:text-slate-400 focus:outline-none max-h-32 min-h-[44px]"
          />

          {/* Action Buttons Inside Composer */}
          <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
            {isStreaming ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onStop}
                className="h-7 px-2.5 text-[11px] font-semibold gap-1"
              >
                <span className="h-2 w-2 rounded-xs bg-white" />
                <span>Stop</span>
              </Button>
            ) : (
              <Button
                type="submit"
                variant="ai"
                size="sm"
                disabled={!input.trim() || disabled}
                className="h-7 w-7 p-0 rounded-lg flex items-center justify-center text-xs"
              >
                <svg
                  className="h-3.5 w-3.5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* Footer Meta: Model Selector & Shortcut hints */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ModelSelector
              selectedProvider={selectedProvider}
              onSelectProvider={onSelectProvider}
              disabled={isStreaming || disabled}
            />
            <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400">
              Grounded in indexed codebase
            </span>
          </div>

          <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400">
            Press{' '}
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1 text-[9px] text-slate-300">
              Enter
            </kbd>{' '}
            to send,{' '}
            <kbd className="rounded border border-slate-700 bg-slate-800 px-1 text-[9px] text-slate-300">
              Shift+Enter
            </kbd>{' '}
            for newline
          </span>
        </div>
      </form>
    </div>
  );
}
