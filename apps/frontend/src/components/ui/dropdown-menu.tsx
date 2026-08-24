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
      <div ref={containerRef} className="relative inline-block text-left">
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
      className={cn('cursor-pointer inline-flex items-center', className)}
    >
      {children}
    </div>
  );
}

export function DropdownMenuContent({
  align = 'left',
  side = 'bottom',
  className,
  children,
}: {
  align?: 'left' | 'right' | 'center';
  side?: 'top' | 'bottom';
  className?: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(DropdownContext);
  if (!context?.open) return null;

  const alignStyles = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  const sideStyles = {
    bottom: 'top-full mt-2 origin-top',
    top: 'bottom-full mb-2 origin-bottom',
  };

  return (
    <div
      className={cn(
        'absolute z-50 min-w-[14rem] overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b101f] p-1.5 text-slate-200 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in-0 zoom-in-95 duration-100',
        alignStyles[align],
        sideStyles[side],
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
        'px-3 py-1.5 text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-slate-800/80', className)} />;
}
