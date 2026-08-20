import * as React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'ai';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    outline: 'text-foreground border-border bg-background',
    destructive: 'border-transparent bg-destructive/15 text-destructive border-destructive/20',
    success: 'border-transparent bg-success/15 text-success border-success/20',
    warning: 'border-transparent bg-warning/15 text-warning border-warning/20',
    ai: 'border-transparent bg-ai/15 text-ai border-ai/20',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.2',
    md: 'text-xs px-2.5 py-0.5',
  };

  const dotColors = {
    default: 'bg-primary-foreground',
    secondary: 'bg-secondary-foreground',
    outline: 'bg-foreground',
    destructive: 'bg-destructive',
    success: 'bg-success',
    warning: 'bg-warning',
    ai: 'bg-ai',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors select-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </div>
  );
}
