"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              shape?: 'pill' | 'rectangular' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  role?: 'customer' | 'provider';
  onSuccess: () => void;
  onError: (message: string) => void;
}

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string; errors?: Array<{ msg?: string }> } } }).response;
    return response?.data?.error || response?.data?.errors?.[0]?.msg || fallback;
  }

  return fallback;
};

export function GoogleLoginButton({ role = 'customer', onSuccess, onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { googleLogin, isLoading } = useAuth();
  const { t } = useLanguage();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptReady || !clientId || !buttonRef.current || !window.google) return;

    buttonRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response.credential) {
          onError(t('login.googleError'));
          return;
        }

        setIsSubmitting(true);
        try {
          await googleLogin({ credential: response.credential, role });
          onSuccess();
        } catch (error) {
          onError(getAuthErrorMessage(error, t('login.googleError')));
        } finally {
          setIsSubmitting(false);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      width: buttonRef.current.clientWidth || 360,
    });
  }, [clientId, googleLogin, onError, onSuccess, role, scriptReady, t]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center rounded-full bg-white dark:bg-neutral-900 px-3 py-3.5 text-sm font-semibold text-neutral-400 dark:text-neutral-500 shadow-sm ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 cursor-not-allowed opacity-60"
      >
        {t('login.googleNotConfigured')}
      </button>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div className="relative min-h-11 w-full">
        <div ref={buttonRef} className={isSubmitting || isLoading ? 'pointer-events-none opacity-60' : ''} />
        {(isSubmitting || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 dark:bg-neutral-900/70">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-600 dark:text-neutral-300" />
          </div>
        )}
      </div>
    </>
  );
}
