'use client';

import { Card } from '@/components/ui/card';
import { Repository } from '@/services/repository.service';

interface RepositoryStatsCardProps {
  repository: Repository;
}

export function RepositoryStatsCard({ repository }: RepositoryStatsCardProps) {
  const stats = [
    {
      label: 'Default Branch',
      value: repository.defaultBranch || 'main',
      icon: '🌿',
    },
    {
      label: 'Primary Language',
      value: repository.language || 'TypeScript',
      icon: '💻',
    },
    {
      label: 'Total Commits',
      value: (repository.commitsCount ?? 0).toLocaleString(),
      icon: '📦',
    },
    {
      label: 'Pull Requests',
      value: (repository.pullRequestsCount ?? 0).toLocaleString(),
      icon: '🔀',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="p-4 border border-slate-800/80 bg-[#0b101f] rounded-2xl shadow-lg space-y-1.5"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{s.label}</span>
            <span>{s.icon}</span>
          </div>
          <div className="text-lg font-bold text-white font-mono truncate">{s.value}</div>
        </Card>
      ))}
    </div>
  );
}
