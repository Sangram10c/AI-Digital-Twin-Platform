'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { authService } from '@/services/auth.service';
import type { AuthResponse } from '@/types/auth.types';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await authService.register({
        email: data.email,
        password: data.password,
        displayName: data.name,
      });

      const payload: AuthResponse =
        response && typeof response === 'object' && 'data' in response
          ? (response as { data: AuthResponse }).data
          : response;

      if (payload && payload.user && payload.tokens) {
        login(payload.user, payload.tokens);
        router.push('/workspaces');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { status?: number; data?: { message?: string | string[] } };
      };
      if (apiErr.response?.status === 409) {
        setServerError(
          'An account with this email address already exists. Please sign in instead.',
        );
      } else {
        const msg =
          apiErr.response?.data?.message ||
          'Registration failed. Please check your details and try again.';
        setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl">
      <CardHeader className="space-y-1.5 p-6">
        <CardTitle className="text-xl font-bold text-white">Create your account</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Get started with your AI Digital Twin engineering workspace.
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
            <label className="text-xs font-semibold text-slate-300">Full Name</label>
            <Input
              type="text"
              placeholder="Sarah Connor"
              autoComplete="name"
              {...register('name')}
              className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
            />
            {errors.name && <p className="text-[11px] text-rose-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Work Email</label>
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
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <Input
              type="password"
              placeholder="•••••••• (min 8 characters)"
              autoComplete="new-password"
              {...register('password')}
              className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
            />
            {errors.password && (
              <p className="text-[11px] text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="bg-slate-900/60 border-slate-800 focus:border-blue-500 text-white text-xs"
            />
            {errors.confirmPassword && (
              <p className="text-[11px] text-rose-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" variant="ai" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center border-t border-slate-800 p-6 pt-4 text-xs text-slate-400">
        <span>Already have an account? </span>
        <Link href="/login" className="ml-1 font-semibold text-blue-400 hover:text-blue-300">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
