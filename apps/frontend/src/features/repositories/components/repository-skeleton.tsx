'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function RepositorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 rounded-xl bg-slate-800" />
          <Skeleton className="h-4 w-96 rounded-lg bg-slate-800/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-xl bg-slate-800" />
          <Skeleton className="h-8 w-28 rounded-xl bg-slate-800" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-2">
            <Skeleton className="h-4 w-20 bg-slate-800" />
            <Skeleton className="h-6 w-16 bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-4">
        <Skeleton className="h-5 w-40 bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl bg-slate-900/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
