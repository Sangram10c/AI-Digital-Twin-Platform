'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error =
    searchParams.get('error') ||
    'Google authentication is not yet enabled for this platform deployment.';

  return (
    <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-6">
      <CardHeader className="space-y-2">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-400 text-2xl">
          ℹ
        </div>
        <CardTitle className="text-lg font-bold text-white">Google OAuth Callback</CardTitle>
        <CardDescription className="text-xs text-slate-400">{error}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/login')}
          className="w-full text-xs"
        >
          Return to Sign In
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GoogleCallbackPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading OAuth handshake...</span>
        </Card>
      }
    >
      <GoogleCallbackContent />
    </React.Suspense>
  );
}
