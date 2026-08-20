'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'ai' | 'success' | 'warning' | 'destructive';
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  badge,
  badgeVariant = 'secondary',
  icon,
  href,
  className,
}: MetricCardProps) {
  const content = (
    <Card
      className={cn(
        'p-5 border border-slate-800/80 bg-[#0b101f] rounded-2xl shadow-lg relative overflow-hidden transition-all duration-200 group hover:border-slate-700',
        href && 'hover:border-blue-500/40 cursor-pointer',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-blue-400 transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-extrabold text-white tracking-tight font-mono">{value}</div>
        {badge && (
          <Badge variant={badgeVariant} size="sm" className="font-mono text-[10px]">
            {badge}
          </Badge>
        )}
      </div>

      {subtitle && <p className="mt-2 text-[11px] text-slate-500 font-mono truncate">{subtitle}</p>}
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
