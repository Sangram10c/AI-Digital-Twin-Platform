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
    <div className="shrink-0 w-full px-4 sm:px-8 py-3 bg-[#080d1a]/95 border-t border-slate-800/80 backdrop-blur-md z-20">
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Integrated Chat Input Container */}
        <div className="relative flex flex-col rounded-2xl border border-slate-800 bg-[#0b101f] shadow-xl ring-1 ring-white/5 focus-within:border-blue-500/60 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all p-2.5">
          {/* Textarea Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your project, architecture, commits, or code..."
            disabled={disabled}
            className="w-full resize-none bg-transparent px-2.5 pt-1.5 pb-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none max-h-36 min-h-[44px]"
          />

          {/* Bottom Action Bar Inside Input Container */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 mt-1">
            {/* Drop-up Model Selector on Left */}
            <ModelSelector
              selectedProvider={selectedProvider}
              onSelectProvider={onSelectProvider}
              disabled={isStreaming || disabled}
            />

            {/* Send / Stop Button on Right */}
            <div className="flex items-center gap-1.5 pr-0.5">
              {isStreaming ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onStop}
                  className="h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-lg"
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
                  className="h-7 w-7 p-0 rounded-lg flex items-center justify-center text-xs shadow-md shadow-blue-500/20"
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
        </div>
      </form>
    </div>
  );
}
