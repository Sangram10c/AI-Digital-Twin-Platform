import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function UnauthorizedPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#050811] text-foreground">
      <AnimatedBackground variant="subtle" />
      <Card className="relative z-10 w-full max-w-md border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-400 text-3xl">
            🔒
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            401 — Session Expired
          </span>
          <CardTitle className="text-xl font-bold text-white">Authentication Required</CardTitle>
          <CardDescription className="text-xs text-slate-400 leading-relaxed">
            Your session has expired or is invalid. Please sign in again to access your engineering
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Link href="/login">
            <Button variant="ai" className="w-full text-xs">
              Sign In to Continue
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
