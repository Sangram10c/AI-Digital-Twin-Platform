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
      icon: (
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      ),
      desc: 'Source files, markdown & docs',
    },
    {
      label: 'Vector Chunks',
      value: (statistics?.totalChunks ?? 0).toLocaleString(),
      icon: (
        <svg
          className="w-4 h-4 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
      desc: 'Normalized code segments',
    },
    {
      label: 'pgvector Embeddings',
      value: (statistics?.embeddedChunks ?? 0).toLocaleString(),
      icon: (
        <svg
          className="w-4 h-4 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      ),
      desc: '768-dim cosine vectors',
    },
    {
      label: 'Processing Queue',
      value: (statistics?.pendingJobs ?? 0).toLocaleString(),
      icon: (
        <svg
          className="w-4 h-4 text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      ),
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
