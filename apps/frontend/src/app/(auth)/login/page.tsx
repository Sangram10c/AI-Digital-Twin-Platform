'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { authService } from '@/services/auth.service';
import { workspaceService } from '@/services/workspace.service';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { AuthResponse } from '@/types/auth.types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || searchParams.get('from');

  const { login } = useAuthStore();
  const { setWorkspaces, resolveActiveWorkspace } = useWorkspaceStore();

  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authService.login(data);
      // Support both direct AuthResponse and nested { data: AuthResponse }
      const payload: AuthResponse =
        response && typeof response === 'object' && 'data' in response
          ? (response as { data: AuthResponse }).data
          : response;

      if (payload && payload.user && payload.tokens) {
        login(payload.user, payload.tokens);

        // Fetch workspaces to route intelligently
        try {
          const workspaces = await workspaceService.getWorkspaces();
          setWorkspaces(workspaces);
          const active = resolveActiveWorkspace();

          if (redirectTarget && redirectTarget.startsWith('/')) {
            router.push(redirectTarget);
          } else if (active) {
            router.push(`/${active.slug}/dashboard`);
          } else {
            router.push('/workspaces');
          }
        } catch {
          router.push(redirectTarget || '/workspaces');
        }
      } else {
        setServerError('Invalid response format received from server.');
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { status?: number; data?: { message?: string | string[] } };
      };
      if (apiErr.response?.status === 401) {
        setServerError('Email or password is incorrect. Please verify your credentials.');
      } else if (apiErr.response?.status === 429) {
        setServerError('Too many attempts. Please wait a moment and try again.');
      } else {
        const msg =
          apiErr.response?.data?.message ||
          'Unable to sign in. Please check your connection and try again.';
        setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (provider: 'github' | 'google') => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    if (provider === 'github') {
      window.location.href = `${baseUrl}/github/connect`;
    } else {
      setServerError('Google OAuth is not yet configured on this deployment.');
    }
  };

  return (
    <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl">
      <CardHeader className="space-y-1.5 p-6">
        <CardTitle className="text-xl font-bold text-white">Sign in to your account</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Enter your email and password to access your project workspace.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {serverError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <Input
              type="email"
              placeholder="developer@company.com"
              autoComplete="email"
              {...register('email')}
              className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
            />
            {errors.email && <p className="text-[11px] text-rose-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
            />
            {errors.password && (
              <p className="text-[11px] text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" variant="ai" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#0b101f] px-2 text-slate-500 font-mono text-[10px]">
              Or continue with
            </span>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuth('github')}
            className="w-full text-xs"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOAuth('google')}
            className="w-full text-xs"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-800 p-6 pt-4 text-xs text-slate-400">
        <span>Don&apos;t have an account? </span>
        <Link href="/register" className="ml-1 font-semibold text-blue-400 hover:text-blue-300">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl text-center p-8 space-y-4">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-slate-400 font-mono">Loading sign in...</span>
        </Card>
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}
