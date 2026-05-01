"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const router = useRouter();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">You must be logged in to view this page.</p>
          <Link
            href={`/${country}/login`}
            className="bg-[#171717] text-white px-6 py-2 rounded-full font-semibold hover:bg-black transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push(`/${country}/login`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-neutral-950 flex flex-col font-sans">
      {user.role === 'customer' && <Navbar />}

      <main className="flex-1 container mx-auto px-4 max-w-3xl py-12">
        <Link
          href={`/${country}/${user.role === 'admin' ? 'admin' : user.role === 'provider' ? 'provider-dashboard' : 'dashboard'}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <SettingsPanel />

        <div className="bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-900/50 rounded-3xl p-8 shadow-sm max-w-3xl mx-auto mb-12">
          <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Sign Out</h2>
          <p className="text-sm text-neutral-500 mb-5">
            You will be signed out of your account on this device.
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-7 py-3 rounded-full text-sm font-bold transition-all active:scale-95 shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </main>

      {user.role === 'customer' && <Footer />}
    </div>
  );
}
