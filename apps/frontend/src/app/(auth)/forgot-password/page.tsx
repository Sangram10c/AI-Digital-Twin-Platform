'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { authService } from '@/services/auth.service';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      await authService.forgotPassword(data);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg =
        apiErr.response?.data?.message || 'Unable to request password reset. Please try again.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-slate-800/80 bg-[#0b101f] shadow-2xl rounded-2xl">
      <CardHeader className="space-y-1.5 p-6">
        <CardTitle className="text-xl font-bold text-white">Reset your password</CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Enter your registered email address to receive password recovery instructions.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {serverError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {serverError}
          </div>
        )}

        {isSubmitted ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-2xl">
              ✓
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">Reset Link Sent</h4>
              <p className="text-xs text-slate-400">
                If an account exists with that email address, we have dispatched reset instructions.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
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

            <Button type="submit" variant="ai" className="w-full" isLoading={isLoading}>
              Send Reset Instructions
            </Button>
          </form>
        )}
      </CardContent>

      {!isSubmitted && (
        <CardFooter className="flex justify-center border-t border-slate-800 p-6 pt-4 text-xs text-slate-400">
          <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
            ← Back to Sign In
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
