'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiAnalytics } from '@/services/analytics.service';

interface AdminProvidersGridProps {
  ai?: AiAnalytics;
}

export function AdminProvidersGrid({ ai }: AdminProvidersGridProps) {
  const providers = [
    {
      provider: 'Google Gemini',
      model: 'gemini-2.0-flash',
      latency: `${ai?.averageLatencyMs ?? 420}ms`,
      status: 'ACTIVE',
      badge: 'Primary Default',
    },
    {
      provider: 'Groq Cloud',
      model: 'llama-3.3-70b-versatile',
      latency: '210ms',
      status: 'ACTIVE',
      badge: 'Low Latency',
    },
    {
      provider: 'OpenAI',
      model: 'gpt-4o-mini',
      latency: '650ms',
      status: 'ACTIVE',
      badge: 'Available',
    },
    {
      provider: 'Anthropic Claude',
      model: 'claude-3-5-sonnet',
      latency: '820ms',
      status: 'STANDBY',
      badge: 'Available',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            AI Provider Abstraction Layer
          </h2>
          <p className="text-xs text-slate-400">
            Multi-model routing, fallback failovers, and token telemetry across supported AI
            backends.
          </p>
        </div>
        <Badge variant="ai" size="sm" dot className="font-mono text-[10px]">
          {(ai?.totalTokens ?? 0).toLocaleString()} Total Tokens
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map((p) => (
          <Card
            key={p.provider}
            className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] shadow-lg space-y-2.5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">{p.provider}</span>
              <Badge
                size="sm"
                variant={p.status === 'ACTIVE' ? 'ai' : 'outline'}
                className="font-mono text-[9px]"
              >
                {p.status}
              </Badge>
            </div>

            <div className="text-xs font-mono text-slate-300 truncate">{p.model}</div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
              <span>Avg Latency:</span>
              <span className="text-emerald-400">{p.latency}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
