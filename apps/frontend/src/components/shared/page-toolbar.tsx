import * as React from 'react';
import { cn } from '@/utils/cn';

export interface PageToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export const PageToolbar = React.forwardRef<HTMLDivElement, PageToolbarProps>(
  ({ className, left, right, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-1',
          className,
        )}
        {...props}
      >
        {left ||
          (children && (
            <div className="flex flex-wrap items-center gap-2.5 flex-1">{left || children}</div>
          ))}
        {right && <div className="flex items-center gap-2.5 shrink-0">{right}</div>}
      </div>
    );
  },
);

PageToolbar.displayName = 'PageToolbar';
