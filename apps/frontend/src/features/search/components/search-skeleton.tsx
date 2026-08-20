'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-800 bg-[#0b101f] space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36 bg-slate-800" />
              <Skeleton className="h-4 w-16 bg-slate-800" />
            </div>
            <Skeleton className="h-3 w-56 bg-slate-800/60" />
            <Skeleton className="h-12 w-full rounded-lg bg-slate-900/60" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-4">
        <Skeleton className="h-5 w-48 bg-slate-800" />
        <Skeleton className="h-64 w-full rounded-xl bg-slate-900/60" />
      </div>
    </div>
  );
}
