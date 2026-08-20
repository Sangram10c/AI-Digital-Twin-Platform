import * as React from 'react';
import { cn } from '@/utils/cn';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string | React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, badge, icon, breadcrumbs, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-4 border-b border-border/80 pb-5', className)}
        {...props}
      >
        {breadcrumbs && <div className="text-xs">{breadcrumbs}</div>}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                {icon}
              </div>
            )}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl truncate">
                  {title}
                </h1>
                {badge}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                  {description}
                </p>
              )}
            </div>
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
        </div>
      </div>
    );
  },
);

PageHeader.displayName = 'PageHeader';
