'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types/user.types';
import { UserNav } from '@/components/layout/user-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  React.useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If authenticated but not admin, render 403 Forbidden state
  if (user && user.role !== UserRole.ADMIN) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center p-6 text-center space-y-4 bg-background">
        <AnimatedBackground variant="minimal" />
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive text-xl font-bold">
          !
        </div>
        <h1 className="relative z-10 text-xl font-bold text-foreground">403 — Access Restricted</h1>
        <p className="relative z-10 text-xs text-muted-foreground max-w-sm">
          Platform Administration is restricted to users with the{' '}
          <code className="font-mono text-destructive">UserRole.ADMIN</code> role.
        </p>
        <Button
          onClick={() => router.push('/workspaces')}
          size="sm"
          variant="outline"
          className="relative z-10"
        >
          Return to Workspaces
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AnimatedBackground variant="subtle" />

      {/* Admin Elevated Top Bar */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Logo size="sm" href="/admin" subtitle="Admin Console" priority />
          <Badge variant="ai" size="sm">
            Platform Operator
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/workspaces">
            <Button size="sm" variant="ghost" className="text-xs">
              ← Back to App
            </Button>
          </Link>
          <UserNav />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
