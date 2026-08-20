'use client';

import * as React from 'react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { CommandPalette } from '@/components/shared/command-palette';
import { UserNav } from './user-nav';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { WorkspaceSwitcher } from './workspace-switcher';
import { getWorkspaceNavSections } from '@/config/nav.config';
import { useUIStore } from '@/store/ui.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';

export function AppHeader() {
  const params = useParams();
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const { currentWorkspace } = useWorkspaceStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = React.useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = React.useState(false);

  const slug = (params?.workspaceSlug as string) || currentWorkspace?.slug || 'default';
  const navSections = getWorkspaceNavSections(slug);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md">
        {/* Left Side: Toggle Sidebar & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Desktop sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle sidebar"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>

          {/* Mobile drawer toggle */}
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="flex md:hidden h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>

          {/* Breadcrumbs */}
          <div className="truncate">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Side: Command Trigger, Notification Indicator, UserNav */}
        <div className="flex items-center gap-2.5">
          {/* Command Palette Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <svg
              className="h-3.5 w-3.5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <span>Search history & commands...</span>
            <kbd className="rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
              Ctrl+K
            </kbd>
          </button>

          {/* Mobile search trigger icon */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex sm:hidden h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {/* Notification Bell */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          {/* User Profile Dropdown */}
          <UserNav />
        </div>
      </header>

      {/* Global Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="left" className="w-72 p-4">
          <div className="mb-6">
            <WorkspaceSwitcher />
          </div>
          <div className="space-y-6">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <h4 className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
                  {section.title}
                </h4>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileSheetOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
