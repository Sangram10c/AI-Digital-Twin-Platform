'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import type { FlowStep } from '../data/home-content';

export function FlowNode({
  step,
  isLast,
  className,
}: {
  step: FlowStep;
  isLast?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex flex-col items-center flex-1 min-w-[200px] text-left group',
        className,
      )}
    >
      {/* Connected Line on Desktop */}
      {!isLast && (
        <div className="hidden lg:block absolute top-7 left-1/2 w-full h-[2px] bg-border z-0">
          <div
            className={cn(
              'h-full bg-gradient-to-r from-primary to-ai transition-all duration-500',
              hovered ? 'w-full opacity-100' : 'w-0 opacity-40',
            )}
          />
        </div>
      )}

      {/* Connected Line on Mobile/Tablet Vertical Flow */}
      {!isLast && (
        <div className="lg:hidden absolute left-5 top-12 bottom-0 w-[2px] bg-border z-0" />
      )}

      {/* Node Card */}
      <div className="relative z-10 flex lg:flex-col items-start gap-3.5 w-full p-5 rounded-2xl border border-slate-800/80 bg-[#0b101f] transition-all duration-200 hover:border-blue-500/60 hover:bg-[#0d1427] hover:-translate-y-1 hover:shadow-[0_8px_30px_-6px_rgba(37,99,235,0.2)]">
        {/* Step Badge with Icon */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-lg shadow-xs transition-colors duration-200',
            hovered ? 'border-primary/60 bg-primary/10 text-primary' : 'text-foreground',
          )}
        >
          {step.icon}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
              Step 0{step.step}
            </span>
            <Badge
              size="sm"
              variant={hovered ? 'ai' : 'secondary'}
              className="text-[9px] px-1.5 py-0"
            >
              {step.category}
            </Badge>
          </div>

          <h4 className="text-xs font-bold text-foreground truncate">{step.title}</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
            {step.description}
          </p>

          <div className="pt-1 text-[10px] font-mono text-ai truncate">⚡ {step.tech}</div>
        </div>
      </div>
    </div>
  );
}
