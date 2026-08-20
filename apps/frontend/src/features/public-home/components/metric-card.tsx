import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend = 'up',
  icon,
  subtitle,
  className,
}: MetricCardProps) {
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <Card
      className={cn('p-4 space-y-2 bg-card/60 backdrop-blur-xs border border-border', className)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {icon && <span className="text-muted-foreground/70">{icon}</span>}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </span>
        {change && (
          <span
            className={cn('text-xs font-semibold font-mono flex items-center gap-0.5', trendColor)}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {change}
          </span>
        )}
      </div>

      {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
    </Card>
  );
}
