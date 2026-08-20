import React from 'react';
import { PublicHeader, PublicFooter } from '@/components/layout';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AnimatedBackground variant="full" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
