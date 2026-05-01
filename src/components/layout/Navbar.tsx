"use client";

import React from 'react';
import { Zap, Menu } from "lucide-react";
import { LoginButton } from '../auth/LoginButton';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function Navbar() {
  const params = useParams();
  const country = params?.country || 'lk';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${country}`} className="flex items-center gap-2">
          <div className="bg-[#171717] dark:bg-white p-2 rounded-xl text-white dark:text-[#171717] shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">AgoraTask</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center font-medium text-sm text-neutral-500 dark:text-neutral-400">
          <Link href={`/${country}/services`} className="hover:text-[#171717] dark:hover:text-white transition-colors">Services</Link>
          <Link href={`/${country}/dashboard`} className="hover:text-[#171717] dark:hover:text-white transition-colors">Dashboard</Link>
          <Link href={`/${country}/providers/colombo-cleaners`} className="hover:text-[#171717] dark:hover:text-white transition-colors">For Providers</Link>
        </nav>

        <div className="flex items-center gap-4">
          <LoginButton />
          <button className="md:hidden text-slate-500">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
