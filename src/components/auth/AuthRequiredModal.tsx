"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Lock, LockKeyhole, Mail, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface AuthRequiredModalProps {
  country: string;
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  title?: string;
  message?: string;
}

export function AuthRequiredModal({
  country,
  isOpen,
  onClose,
  onLoginSuccess,
  title = 'Login required',
  message = 'Please log in or create an account to continue.',
}: AuthRequiredModalProps) {
  const { t } = useLanguage();
  const { login, isLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loginError, setLoginError] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const queryString = searchParams.toString();
  const returnTo = `${pathname}${queryString ? `?${queryString}` : ''}`;
  const authQuery = `?returnTo=${encodeURIComponent(returnTo)}`;

  if (!isOpen) return null;

  const getLoginErrorMessage = (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { error?: string; errors?: Array<{ msg?: string }> } } }).response;
      return response?.data?.error || response?.data?.errors?.[0]?.msg || 'Invalid email or password.';
    }

    return 'Invalid email or password.';
  };

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError('');

    try {
      await login({ email: data.email, password: data.password });
      reset();
      onClose();
      onLoginSuccess?.();
    } catch (error) {
      setLoginError(getLoginErrorMessage(error));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="auth-required-title">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close login prompt"
      />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Close login prompt"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h2 id="auth-required-title" className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{message}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="modal-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="modal-email"
                type="email"
                autoComplete="email"
                placeholder={t('login.emailPlaceholder')}
                className={`block w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:ring-2 dark:bg-slate-950 dark:text-white ${
                  errors.email
                    ? 'border-red-300 focus:ring-red-500 dark:border-red-900'
                    : 'border-slate-200 focus:ring-indigo-500 dark:border-slate-700'
                }`}
                {...register('email')}
              />
            </div>
            {errors.email && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="modal-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Password
            </label>
            <div className="relative mt-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="modal-password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                className={`block w-full rounded-xl border bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:ring-2 dark:bg-slate-950 dark:text-white ${
                  errors.password
                    ? 'border-red-300 focus:ring-red-500 dark:border-red-900'
                    : 'border-slate-200 focus:ring-indigo-500 dark:border-slate-700'
                }`}
                {...register('password')}
              />
            </div>
            {errors.password && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>}
          </div>

          {loginError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Login
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href={`/${country}/forgot-password`} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            Forgot Password
          </Link>
          <Link
            href={`/${country}/register${authQuery}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
