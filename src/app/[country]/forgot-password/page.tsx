"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Zap, Mail, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const params = useParams();
  const country = params.country as string || 'lk';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    // TODO: Integrate actual forgot password by email logic here
    console.log(`Sending reset link to`, data.email);
    
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Enter your email to receive a password reset link.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white dark:bg-neutral-900 px-6 py-12 shadow-sm border border-neutral-200/60 dark:border-neutral-800 rounded-3xl sm:px-12">
          
          {isSubmitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-[#171717] dark:text-white">Email Sent</h3>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                If an account exists with that email, we have sent a password reset link. Please check your inbox.
              </p>
              <div className="mt-8">
                <Link 
                  href={`/${country}/login`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#171717] dark:bg-white px-8 py-4 text-sm font-bold text-white dark:text-[#171717] shadow-sm hover:bg-black dark:hover:bg-neutral-200 transition-all active:scale-95"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#171717] dark:text-neutral-300">
                  Email address
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
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#171717] dark:bg-white px-8 py-4 text-sm font-bold text-white dark:text-[#171717] shadow-sm hover:bg-black dark:hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717] transition-all active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center mt-6">
                <Link href={`/${country}/login`} className="text-sm font-semibold text-[#171717] dark:text-white hover:underline transition-all">
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
