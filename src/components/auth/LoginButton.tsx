"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronDown, User, Briefcase, Shield, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function LoginButton() {
  const params = useParams();
  const country = params?.country || 'lk';
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    router.push(`/${country}/login`);
  };

  // ── Logged-in state ─────────────────────────────────────────────
  if (user) {
    const roleBadgeColor =
      user.role === 'admin'
        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        : user.role === 'provider'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

    const dashboardPath =
      user.role === 'admin'
        ? `/${country}/admin`
        : user.role === 'provider'
        ? `/${country}/provider-dashboard`
        : `/${country}/dashboard`;

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 hover:shadow-md transition-all"
          aria-expanded={isOpen}
        >
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profileImage}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
              <User className="w-4 h-4 text-neutral-500" />
            </div>
          )}
          <span className="text-sm font-semibold text-[#171717] dark:text-white max-w-[96px] truncate hidden sm:block">
            {user.name}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden py-2 z-50">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  {user.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-neutral-100 dark:border-neutral-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-neutral-500" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#171717] dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${roleBadgeColor}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashboard link */}
              <Link
                href={dashboardPath}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-[#171717] dark:hover:text-white transition-colors"
              >
                {user.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : user.role === 'provider' ? (
                  <Briefcase className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                Dashboard
              </Link>

              {/* Profile link */}
              <Link
                href={`/${country}/profile`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-[#171717] dark:hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                Profile & Settings
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-neutral-100 dark:border-neutral-800 mt-1"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Guest state ────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/${country}/login`}
        className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-[#171717] dark:hover:text-white transition-colors hidden sm:block"
      >
        Sign In
      </Link>
      <Link
        href={`/${country}/register`}
        className="bg-[#171717] dark:bg-white text-white dark:text-[#171717] hover:bg-black dark:hover:bg-neutral-200 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm active:scale-95"
      >
        Get Started
      </Link>
    </div>
  );
}
