'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TimelineSkeleton() {
  return (
    <div className="relative border-l border-slate-800 ml-4 space-y-6 pl-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="relative pl-6 space-y-2">
          <div className="absolute -left-9 top-3 h-5 w-5 rounded-full bg-slate-800" />
          <div className="p-4 rounded-2xl border border-slate-800 bg-[#0b101f] space-y-2.5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28 bg-slate-800" />
              <Skeleton className="h-3 w-20 bg-slate-800/60" />
            </div>
            <Skeleton className="h-4 w-52 bg-slate-800" />
            <Skeleton className="h-3 w-full bg-slate-800/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
