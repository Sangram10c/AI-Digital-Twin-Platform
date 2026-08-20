import * as React from 'react';
import { Logo } from '@/components/ui/logo';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#050811] text-foreground select-none overflow-hidden">
      {/* Subtle Plain Dark Ambient Glow */}
      <AnimatedBackground variant="subtle" />

      {/* Brand Official Logo */}
      <div className="relative z-10 mb-8 flex flex-col items-center space-y-2">
        <Logo size="md" priority />
        <span className="text-xs font-mono text-slate-400">AI Digital Twin Platform</span>
      </div>

      {/* Centered Auth Card Container */}
      <div className="relative z-10 w-full max-w-md">{children}</div>

      {/* Bottom Security Note */}
      <div className="relative z-10 mt-8 text-center text-xs text-slate-500 font-mono">
        Protected by zero-trust workspace isolation & encrypted token sessions
      </div>
    </div>
  );
}
