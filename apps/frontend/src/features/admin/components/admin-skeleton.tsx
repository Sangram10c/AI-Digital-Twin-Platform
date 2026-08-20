'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AdminSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 bg-slate-800" />
        <Skeleton className="h-3 w-72 bg-slate-800/60" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-3">
            <Skeleton className="h-4 w-28 bg-slate-800" />
            <Skeleton className="h-4 w-full bg-slate-800/60" />
            <Skeleton className="h-3 w-20 bg-slate-800/40" />
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-4">
        <Skeleton className="h-5 w-40 bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl bg-slate-900/60" />
          ))}
        </div>
      </div>
    </div>
  );
}
