"use client";

import { Toaster } from 'react-hot-toast';

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        className: 'text-sm font-semibold',
        style: {
          borderRadius: '14px',
          border: '1px solid rgba(148, 163, 184, 0.28)',
          background: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 18px 45px rgba(15, 23, 42, 0.14)',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
        },
      }}
    />
  );
}
