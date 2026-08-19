'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon?: React.ReactNode;
  href?: string;
  action?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const params = useParams();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const slug = (params?.workspaceSlug as string) || 'default';

  // Global Ctrl+K / Cmd+K listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const items: CommandItem[] = React.useMemo(() => {
    return [
      {
        id: 'chat',
        title: 'New AI Chat Session',
        category: 'Intelligence',
        href: `/${slug}/chat`,
      },
      {
        id: 'search',
        title: 'Hybrid Code & History Search',
        category: 'Intelligence',
        href: `/${slug}/search`,
      },
      {
        id: 'repositories',
        title: 'View Connected Repositories',
        category: 'Engineering',
        href: `/${slug}/repositories`,
      },
      {
        id: 'analytics',
        title: 'Analytics & Insights Dashboard',
        category: 'Engineering',
        href: `/${slug}/analytics`,
      },
      {
        id: 'knowledge',
        title: 'Knowledge Base & Documentation',
        category: 'Engineering',
        href: `/${slug}/knowledge`,
      },
      {
        id: 'timeline',
        title: 'Engineering History Timeline',
        category: 'Engineering',
        href: `/${slug}/timeline`,
      },
      {
        id: 'settings',
        title: 'Workspace Settings',
        category: 'Settings',
        href: `/${slug}/settings`,
      },
    ];
  }, [slug]);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (item: CommandItem) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
    onOpenChange(false);
    setQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-border bg-card shadow-2xl">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <svg
            className="mr-3 h-4 w-4 shrink-0 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search commands, repositories, or ask AI... (ESC to close)"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching actions or navigation targets found.
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors',
                    selectedIndex === index
                      ? 'bg-accent text-accent-foreground'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <span className="flex items-center gap-2">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span>AI Digital Twin Platform</span>
          <div className="flex items-center gap-2">
            <span>Navigate with ↑↓</span>
            <span>•</span>
            <span>Enter to select</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
