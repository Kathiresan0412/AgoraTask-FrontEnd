"use client";

import React from 'react';
import Image from 'next/image';
import { Menu, X } from "lucide-react";
import { LoginButton } from '../auth/LoginButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export function Navbar() {
  const params = useParams();
  const country = params?.country || 'lk';
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isLoginPage = pathname === `/${country}/login`;

  const navLinks = [
    { href: `/${country}/services`, label: t('nav.services') },
    { href: `/${country}/dashboard`, label: t('nav.dashboard') },
    { href: `/${country}/register?role=provider`, label: t('nav.becomeProvider') },
  ];

  React.useEffect(() => {
    setMobileOpen(false);
  }, [country]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4">
        <Link href={`/${country}`} className="flex min-w-0 items-center gap-2.5 leading-none" onClick={() => setMobileOpen(false)}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm shadow-slate-200/70 ring-1 ring-black/5 dark:border-neutral-800 dark:shadow-none dark:ring-white/10">
            <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" priority />
          </div>
          <span className="truncate text-lg font-extrabold tracking-tight sm:text-xl">AgoraTask</span>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center font-medium text-sm text-neutral-500 dark:text-neutral-400">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-[#171717] dark:hover:text-white transition-colors">{link.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <LanguageSwitcher />
          {!isLoginPage && <LoginButton />}
          <button
            type="button"
            onClick={() => setMobileOpen(open => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-neutral-100 hover:text-slate-900 dark:hover:bg-neutral-800 dark:hover:text-white md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
       {mobileOpen && (
       <nav className="border-t border-neutral-200/60 bg-white px-4 py-3 shadow-sm dark:border-neutral-800/60 dark:bg-neutral-950 md:hidden">
          <div className="container mx-auto flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
