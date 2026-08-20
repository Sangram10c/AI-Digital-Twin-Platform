'use client';

import { Card } from '@/components/ui/card';
import { KnowledgeStatistics } from '../types/knowledge.types';

interface KnowledgeMetricsProps {
  statistics?: KnowledgeStatistics;
}

export function KnowledgeMetrics({ statistics }: KnowledgeMetricsProps) {
  const stats = [
    {
      label: 'Indexed Documents',
      value: (statistics?.totalDocuments ?? 0).toLocaleString(),
      icon: '📄',
      desc: 'Source files, markdown & docs',
    },
    {
      label: 'Vector Chunks',
      value: (statistics?.totalChunks ?? 0).toLocaleString(),
      icon: '🧩',
      desc: 'Normalized code segments',
    },
    {
      label: 'pgvector Embeddings',
      value: (statistics?.embeddedChunks ?? 0).toLocaleString(),
      icon: '⚡',
      desc: '768-dim cosine vectors',
    },
    {
      label: 'Processing Queue',
      value: (statistics?.pendingJobs ?? 0).toLocaleString(),
      icon: '🔄',
      desc: 'Active BullMQ background jobs',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="p-4 border border-slate-800/80 bg-[#0b101f] rounded-2xl shadow-lg space-y-1"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{s.label}</span>
            <span>{s.icon}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{s.value}</div>
          <p className="text-[10px] text-slate-400 font-mono truncate">{s.desc}</p>
        </Card>
      ))}
    </div>
  );
}
