"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Zap, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const params = useParams();
  const country = params.country as string || 'lk';
  const router = useRouter();
  
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [registerError, setRegisterError] = useState('');
  const { register: registerUser, isLoading } = useAuth();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setRegisterError('');

    try {
      await registerUser({
        name: data.fullName,
        email: data.email,
        password: data.password,
        role,
      });

      // Redirect based on role after successful registration
      const redirectPath = role === 'provider' ? 'provider-dashboard' : 'dashboard';
      router.push(`/${country}/${redirectPath}`);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.';
      setRegisterError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href={`/${country}`} className="flex items-center gap-2">
            <div className="bg-[#171717] dark:bg-white p-2.5 rounded-2xl text-white dark:text-[#171717] shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#171717] dark:text-white">AgoraTask</span>
          </Link>
        </div>
        <h2 className="mt-8 text-center text-3xl font-bold tracking-tight text-[#171717] dark:text-white">
          {t('register.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t('register.alreadyHaveAccount')}
          <Link href={`/${country}/login`} className="font-semibold text-[#171717] dark:text-white hover:underline transition-all ml-1">
            {t('register.signInHere')}
          </Link>
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white dark:bg-neutral-900 px-6 py-12 shadow-sm border border-neutral-200/60 dark:border-neutral-800 rounded-3xl sm:px-12">
          
          <div className="mb-8 flex p-1 bg-[#F9FAFB] dark:bg-neutral-950 rounded-full border border-neutral-200 dark:border-neutral-800">
            <button 
              onClick={() => setRole('customer')}
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                role === 'customer' 
                  ? 'bg-white dark:bg-neutral-800 shadow-sm text-[#171717] dark:text-white' 
                  : 'text-neutral-500 hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              Customer
            </button>
            <button 
              onClick={() => setRole('provider')}
              type="button"
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                role === 'provider' 
                  ? 'bg-white dark:bg-neutral-800 shadow-sm text-[#171717] dark:text-white' 
                  : 'text-neutral-500 hover:text-[#171717] dark:hover:text-white'
              }`}
            >
              Provider
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-[#171717] dark:text-neutral-300">
                {t('register.namePlaceholder')}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className={`block w-full rounded-full border-0 py-3.5 pl-11 pr-5 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all ${
                    errors.fullName 
                      ? 'ring-red-300 dark:ring-red-900 focus:ring-red-500' 
                      : 'ring-neutral-200 dark:ring-neutral-800 focus:ring-[#171717] dark:focus:ring-white'
                  }`}
                  placeholder="John Doe"
                  {...register('fullName')}
                />
              </div>
              {errors.fullName && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#171717] dark:text-neutral-300">
                {t('common.email')}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full rounded-full border-0 py-3.5 pl-11 pr-5 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all ${
                    errors.email 
                      ? 'ring-red-300 dark:ring-red-900 focus:ring-red-500' 
                      : 'ring-neutral-200 dark:ring-neutral-800 focus:ring-[#171717] dark:focus:ring-white'
                  }`}
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#171717] dark:text-neutral-300">
                {t('common.password')}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`block w-full rounded-full border-0 py-3.5 pl-11 pr-5 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all ${
                    errors.password 
                      ? 'ring-red-300 dark:ring-red-900 focus:ring-red-500' 
                      : 'ring-neutral-200 dark:ring-neutral-800 focus:ring-[#171717] dark:focus:ring-white'
                  }`}
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#171717] dark:text-neutral-300">
                {t('register.confirmPassword')}
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  className={`block w-full rounded-full border-0 py-3.5 pl-11 pr-5 text-[#171717] dark:text-white bg-[#F9FAFB] dark:bg-neutral-950 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 transition-all ${
                    errors.confirmPassword 
                      ? 'ring-red-300 dark:ring-red-900 focus:ring-red-500' 
                      : 'ring-neutral-200 dark:ring-neutral-800 focus:ring-[#171717] dark:focus:ring-white'
                  }`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Error */}
            {registerError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/30 px-4 py-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-400">{registerError}</p>
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#171717] dark:bg-white px-8 py-4 text-sm font-bold text-white dark:text-[#171717] shadow-sm hover:bg-black dark:hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717] transition-all active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t('common.register')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-white dark:bg-neutral-900 px-6 text-neutral-500">{t('login.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-6">
              <button 
                type="button"
                disabled
                className="flex w-full items-center justify-center gap-3 rounded-full bg-white dark:bg-neutral-900 px-3 py-3.5 text-sm font-semibold text-neutral-400 dark:text-neutral-500 shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 cursor-not-allowed opacity-60"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {t('login.googleComingSoon')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
