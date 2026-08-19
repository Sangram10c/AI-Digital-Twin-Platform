'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteContent } from '@/content/site';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useTheme } from '@/components/providers/theme-provider';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/utils/cn';

export function PublicHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Official Logo */}
        <Logo size="sm" priority />

        {/* Desktop Nav Links from siteContent */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          {siteContent.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'transition-colors hover:text-foreground',
                pathname === item.href && 'text-foreground font-semibold',
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Right CTA / Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <Link href="/workspaces">
              <Button size="sm" variant="ai">
                {siteContent.cta.openApp}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="ghost">
                  {siteContent.cta.signIn}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="default">
                  {siteContent.cta.primary}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
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
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card px-4 py-3 md:hidden space-y-2 text-xs">
          {siteContent.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 text-muted-foreground hover:text-foreground font-medium"
            >
              {item.title}
            </Link>
          ))}
          <div className="pt-2 border-t border-border flex items-center gap-2">
            <Link href="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" variant="outline" className="w-full">
                {siteContent.cta.signIn}
              </Button>
            </Link>
            <Link href="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" variant="default" className="w-full">
                {siteContent.cta.primary}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-muted/20 py-8 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size="xs" showText={false} />
          <span className="font-semibold text-foreground">{siteContent.name}</span>
          <span>{siteContent.footer.copyright}</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {siteContent.footer.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors"
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
