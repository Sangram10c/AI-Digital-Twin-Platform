'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { AIProvider } from '@/types/chat.types';

interface ModelSelectorProps {
  selectedProvider: AIProvider;
  onSelectProvider: (provider: AIProvider) => void;
  disabled?: boolean;
}

const PROVIDERS: Array<{
  id: AIProvider;
  name: string;
  badge: string;
}> = [
  { id: 'gemini', name: 'Google Gemini', badge: 'Default' },
  { id: 'groq', name: 'Groq (Llama 3.3)', badge: 'Low Latency' },
  { id: 'openai', name: 'OpenAI (GPT-4o)', badge: 'Reasoning' },
  { id: 'anthropic', name: 'Claude 3.5 Sonnet', badge: 'Analysis' },
  { id: 'ollama', name: 'Local Ollama', badge: 'Private' },
  { id: 'cloudflare', name: 'Cloudflare AI', badge: 'Edge' },
  { id: 'openrouter', name: 'OpenRouter', badge: 'Multi-model' },
  { id: 'huggingface', name: 'Hugging Face', badge: 'Open' },
];

export function ModelSelector({
  selectedProvider,
  onSelectProvider,
  disabled = false,
}: ModelSelectorProps) {
  const current = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  return (
    <div className="relative inline-flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger className={disabled ? 'pointer-events-none opacity-50' : ''}>
          <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white cursor-pointer select-none">
            <span className="font-medium text-slate-200">{current.name}</span>
            <svg
              className="h-3 w-3 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m18 15-6-6-6 6" />
            </svg>
          </div>
        </DropdownMenuTrigger>

        {/* Opens upward so it is never clipped off the bottom */}
        <DropdownMenuContent
          align="left"
          side="top"
          className="w-56 bg-[#0b101f] border border-slate-800 shadow-2xl z-50 mb-2"
        >
          <DropdownMenuLabel>Select Model Provider</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PROVIDERS.map((provider) => (
            <DropdownMenuItem
              key={provider.id}
              onClick={() => onSelectProvider(provider.id)}
              className={
                provider.id === selectedProvider
                  ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-500/20'
                  : ''
              }
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs">{provider.name}</span>
                <Badge variant="secondary" size="sm" className="text-[9px] font-mono">
                  {provider.badge}
                </Badge>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
