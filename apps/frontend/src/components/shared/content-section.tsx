import * as React from 'react';
import { cn } from '@/utils/cn';

export interface ContentSectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const ContentSection = React.forwardRef<HTMLElement, ContentSectionProps>(
  ({ className, title, description, actions, children, ...props }, ref) => {
    return (
      <section ref={ref} className={cn('space-y-4', className)} {...props}>
        {(title || description || actions) && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {title && (
                <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
              )}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 mt-2 sm:mt-0">{actions}</div>}
          </div>
        )}
        {children}
      </section>
    );
  },
);

ContentSection.displayName = 'ContentSection';
