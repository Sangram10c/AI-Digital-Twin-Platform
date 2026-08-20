import React from 'react';
import { Logo } from '@/components/ui/logo';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <AnimatedBackground variant="hero" />

      {/* Official Brand Header */}
      <div className="relative z-10 mb-6 flex flex-col items-center text-center">
        <Logo size="md" subtitle="Enterprise Engineering Intelligence" priority />
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">{children}</div>

      {/* Footer info */}
      <div className="relative z-10 mt-8 text-center text-xs text-muted-foreground">
        <span>Protected by enterprise JWT token rotation & workspace RBAC.</span>
      </div>
    </div>
  );
}
