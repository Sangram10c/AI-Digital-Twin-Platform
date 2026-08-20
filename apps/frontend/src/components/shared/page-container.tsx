import * as React from 'react';
import { cn } from '@/utils/cn';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full';
  noPadding?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, maxWidth = '7xl', noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full mx-auto space-y-6',
          maxWidthMap[maxWidth],
          !noPadding && 'p-4 sm:p-6 lg:p-8',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

PageContainer.displayName = 'PageContainer';
