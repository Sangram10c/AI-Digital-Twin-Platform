'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28 bg-slate-800" />
              <Skeleton className="h-4 w-4 bg-slate-800" />
            </div>
            <Skeleton className="h-7 w-20 bg-slate-800" />
            <Skeleton className="h-3 w-36 bg-slate-800/60" />
          </div>
        ))}
      </div>

      {/* Domain Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-4">
            <Skeleton className="h-5 w-32 bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-lg bg-slate-900/60" />
              <Skeleton className="h-8 w-full rounded-lg bg-slate-900/60" />
              <Skeleton className="h-8 w-full rounded-lg bg-slate-900/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
