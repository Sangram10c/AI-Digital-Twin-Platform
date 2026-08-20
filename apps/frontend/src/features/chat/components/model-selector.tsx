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
  icon: string;
}> = [
  { id: 'gemini', name: 'Google Gemini', badge: 'Fast / Multi-turn', icon: '✨' },
  { id: 'groq', name: 'Groq (Llama 3.3)', badge: 'Ultra Fast', icon: '⚡' },
  { id: 'openai', name: 'OpenAI (GPT-4o)', badge: 'Reasoning', icon: '🧠' },
  { id: 'anthropic', name: 'Anthropic (Claude 3.5)', badge: 'Analysis', icon: '🔮' },
  { id: 'ollama', name: 'Local Ollama', badge: 'Private / Local', icon: '💻' },
  { id: 'cloudflare', name: 'Cloudflare Workers AI', badge: 'Edge', icon: '☁️' },
  { id: 'openrouter', name: 'OpenRouter', badge: 'Multi-model', icon: '🌐' },
  { id: 'huggingface', name: 'Hugging Face', badge: 'Open Weights', icon: '🤗' },
];

export function ModelSelector({
  selectedProvider,
  onSelectProvider,
  disabled = false,
}: ModelSelectorProps) {
  const current = PROVIDERS.find((p) => p.id === selectedProvider) || PROVIDERS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={disabled ? 'pointer-events-none opacity-50' : ''}>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-blue-500/40 hover:text-white cursor-pointer select-none">
          <span>{current.icon}</span>
          <span className="font-semibold">{current.name}</span>
          <svg
            className="h-3 w-3 text-slate-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="right" className="w-56 bg-[#0b101f] border-slate-800 shadow-2xl">
        <DropdownMenuLabel>Select AI Provider</DropdownMenuLabel>
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
              <div className="flex items-center gap-2">
                <span>{provider.icon}</span>
                <span className="text-xs">{provider.name}</span>
              </div>
              <Badge variant="secondary" size="sm" className="text-[9px] font-mono">
                {provider.badge}
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
