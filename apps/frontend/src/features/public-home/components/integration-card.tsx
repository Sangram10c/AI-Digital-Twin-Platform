import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import type { IntegrationItem } from '@/content/integrations';

export function IntegrationCard({
  integration,
  className,
}: {
  integration: IntegrationItem;
  className?: string;
}) {
  return (
    <Card
      hoverable
      className={cn(
        'p-6 flex flex-col justify-between space-y-4 bg-[#0b101f] border border-slate-800/80 rounded-2xl transition-all duration-200 hover:border-blue-500/60 hover:shadow-[0_8px_30px_-6px_rgba(37,99,235,0.2)] group',
        className,
      )}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 text-xl group-hover:scale-105 transition-transform">
            {integration.icon}
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 font-mono">
            {integration.badge}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            {integration.category}
          </span>
          <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mt-0.5">
            {integration.name}
          </h4>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {integration.description}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 text-xs">
        <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          {integration.status}
        </span>
        <Link
          href={integration.href}
          className="text-blue-400 hover:text-blue-300 group-hover:translate-x-0.5 transition-transform font-medium"
        >
          Connect →
        </Link>
      </div>
    </Card>
  );
}
