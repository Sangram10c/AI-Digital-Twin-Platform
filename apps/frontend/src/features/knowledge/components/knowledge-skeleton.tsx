'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function KnowledgeSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-800" />
            <Skeleton className="h-7 w-16 bg-slate-800" />
            <Skeleton className="h-3 w-32 bg-slate-800/60" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-4">
        <Skeleton className="h-5 w-40 bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl bg-slate-900/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
