'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TimeRangeFilter } from '../types/analytics.types';
import { Repository } from '@/services/repository.service';

interface AnalyticsHeaderProps {
  timeRange: TimeRangeFilter;
  onTimeRangeChange: (val: TimeRangeFilter) => void;
  selectedRepoId: string;
  onRepoChange: (val: string) => void;
  repositories: Repository[];
  isRefetching: boolean;
  onRefresh: () => void;
}

export function AnalyticsHeader({
  timeRange,
  onTimeRangeChange,
  selectedRepoId,
  onRepoChange,
  repositories,
  isRefetching,
  onRefresh,
}: AnalyticsHeaderProps) {
  const repoOptions = [
    { value: 'ALL', label: 'All Repositories' },
    ...repositories.map((r) => ({
      value: r.id,
      label: r.name,
    })),
  ];

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Workspace Analytics & Insights
        </h1>
        <p className="text-xs text-slate-400">
          Telemetry for repository ingestion, vector embeddings, AI inference, and background jobs.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Time Range Selector */}
        <Tabs value={timeRange} onValueChange={(val) => onTimeRangeChange(val as TimeRangeFilter)}>
          <TabsList className="bg-slate-900 border border-slate-800 h-8 p-0.5 rounded-lg">
            <TabsTrigger value="24h" className="text-xs px-2.5 h-7">
              24h
            </TabsTrigger>
            <TabsTrigger value="7d" className="text-xs px-2.5 h-7">
              7d
            </TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-2.5 h-7">
              30d
            </TabsTrigger>
            <TabsTrigger value="90d" className="text-xs px-2.5 h-7">
              90d
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Repository Scope Selector */}
        {repositories.length > 0 && (
          <div className="w-44">
            <Select
              value={selectedRepoId}
              onChange={(e) => onRepoChange(e.target.value)}
              options={repoOptions}
              className="h-8 text-xs bg-slate-900 border-slate-800"
            />
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          disabled={isRefetching}
          onClick={onRefresh}
          className="text-xs h-8 px-2.5 gap-1.5"
        >
          <svg
            className={`h-3 w-3 ${isRefetching ? 'animate-spin text-blue-400' : 'text-slate-400'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
