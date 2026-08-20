import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AnimatedBackground } from '@/components/ui/animated-background';

export default function ForbiddenPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#050811] text-foreground">
      <AnimatedBackground variant="subtle" />
      <Card className="relative z-10 w-full max-w-md border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-400 text-3xl">
            🛡️
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400">
            403 — Access Denied
          </span>
          <CardTitle className="text-xl font-bold text-white">Insufficient Permissions</CardTitle>
          <CardDescription className="text-xs text-slate-400 leading-relaxed">
            You do not have permission to access this area or perform this action within the
            workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 flex flex-col gap-2">
          <Link href="/workspaces">
            <Button variant="outline" className="w-full text-xs">
              Return to Workspaces
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400">
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
