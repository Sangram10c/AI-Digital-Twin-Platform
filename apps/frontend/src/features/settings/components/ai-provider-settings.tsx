import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';

interface AiProviderSettingsProps {
  defaultProvider: string;
  onDefaultProviderChange: (provider: string) => void;
}

const SUPPORTED_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
    isConfigured: true,
    desc: 'Native multimodel RAG with 1M token context window',
    icon: '✨',
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    isConfigured: true,
    desc: 'Ultra-low latency LPU inference engine',
    icon: '⚡',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
    isConfigured: true,
    desc: 'Industry standard generative reasoning models',
    icon: '🧠',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet', 'claude-3-5-haiku'],
    isConfigured: false,
    desc: 'Advanced technical reasoning & coding intelligence',
    icon: '🎭',
  },
  {
    id: 'ollama',
    name: 'Local Ollama',
    models: ['qwen2.5-coder:7b', 'deepseek-r1:8b', 'llama3:8b'],
    isConfigured: true,
    desc: 'Self-hosted airgapped private local models',
    icon: '🦙',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    models: ['@cf/meta/llama-3-8b-instruct'],
    isConfigured: false,
    desc: 'Edge-distributed serverless inference',
    icon: '☁️',
  },
];

export function AiProviderSettings({
  defaultProvider,
  onDefaultProviderChange,
}: AiProviderSettingsProps) {
  const providerOptions = SUPPORTED_PROVIDERS.map((p) => ({
    value: p.id,
    label: `${p.name} ${p.isConfigured ? '(Configured)' : '(Not Set)'}`,
  }));

  return (
    <Card className="border border-slate-800 bg-[#0b101f] p-6 rounded-2xl shadow-xl space-y-6">
      <CardHeader className="p-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-white">AI Providers & Inference</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Configure LLM backends for multi-turn chat, RAG retrieval, and AST code summaries.
          </CardDescription>
        </div>
        <Badge variant="ai" size="sm" dot>
          Phase 13 RAG Engine
        </Badge>
      </CardHeader>

      <div className="space-y-3 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Default Workspace Provider</label>
          <div className="max-w-xs">
            <Select
              value={defaultProvider}
              onChange={(e) => onDefaultProviderChange(e.target.value)}
              options={providerOptions}
              className="bg-slate-900 border-slate-800 text-xs"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            New conversation threads will initialize using this provider by default.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {SUPPORTED_PROVIDERS.map((p) => {
          const isSelectedDefault = defaultProvider === p.id;
          return (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition-colors space-y-2.5 ${
                isSelectedDefault
                  ? 'border-blue-500/50 bg-blue-950/20 shadow-lg shadow-blue-500/5'
                  : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{p.icon}</span>
                  <span className="text-xs font-bold text-white">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {isSelectedDefault && (
                    <Badge variant="ai" size="sm" className="font-mono text-[9px]">
                      Default
                    </Badge>
                  )}
                  <Badge
                    variant={p.isConfigured ? 'success' : 'outline'}
                    size="sm"
                    className="font-mono text-[9px]"
                  >
                    {p.isConfigured ? 'Configured' : 'Not Set'}
                  </Badge>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{p.desc}</p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/60">
                <span>{p.models.length} Available Models</span>
                <span className="truncate max-w-[140px] text-slate-300">{p.models[0]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
