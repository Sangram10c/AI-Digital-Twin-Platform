'use client';

import * as React from 'react';
import { cn } from '@/utils/cn';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={containerRef} className="relative inline-block text-left w-full">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const context = React.useContext(DropdownContext);
  if (!context) return null;

  return (
    <div
      onClick={() => context.setOpen((prev) => !prev)}
      className={cn('cursor-pointer inline-flex items-center w-full', className)}
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  align = 'left',
  className,
  children,
}: {
  align?: 'left' | 'right' | 'center';
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(DropdownContext);
  if (!context?.open) return null;

  const alignStyles = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top',
  };

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[14rem] overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b101f] p-1.5 text-slate-200 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-100',
        alignStyles[align],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  disabled,
  children,
}: {
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const context = React.useContext(DropdownContext);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(e);
    context?.setOpen(false);
  };

  return (
    <div
      role="menuitem"
      onClick={handleClick}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-200 outline-none transition-colors hover:bg-slate-800/80 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1.5 h-px bg-slate-800/80', className)} />;
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono',
        className,
      )}
    >
      {children}
    </div>
  );
}
