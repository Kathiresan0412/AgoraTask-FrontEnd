"use client";

import React from 'react';
import Image from 'next/image';
import { Menu, X } from "lucide-react";
import { LoginButton } from '../auth/LoginButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export function Navbar() {
  const params = useParams();
  const country = params?.country || 'lk';
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isLoginPage = pathname === `/${country}/login`;
  const isRegisterPage = pathname === `/${country}/register`;
  const shouldShowBecomeProvider = user?.role !== 'provider';

  const navLinks = [
    { href: `/${country}`, label: t('nav.home') },
    // { href: `/${country}/messages`, label: t('nav.messages') },
    { href: `/${country}/services`, label: t('nav.services') },
    { href: `/${country}/about`, label: t('nav.aboutUs') },
    ...(shouldShowBecomeProvider
      ? [{ href: `/${country}/register?role=provider`, label: t('nav.becomeProvider') }]
      : []),
  ];

  const isActiveLink = (href: string) => {
    const [hrefPath] = href.split('?');
    if (hrefPath === `/${country}`) {
      return pathname === hrefPath;
    }

    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  React.useEffect(() => {
    setMobileOpen(false);
  }, [country]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-1">
        <Link href={`/${country}`} className="flex min-w-0 items-center gap-2.5 leading-none" onClick={() => setMobileOpen(false)}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm shadow-slate-200/70 ring-1 ring-black/5 dark:border-neutral-800 dark:shadow-none dark:ring-white/10">
            <Image src="/agoratask-icon.svg" alt="AgoraTask" width={28} height={28} className="block h-full w-full object-contain" priority />
          </div>
          <span className="truncate text-lg font-extrabold tracking-tight sm:text-xl">Agora Task</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          {navLinks.map(link => {
            const active = isActiveLink(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-5 transition-colors after:absolute after:bottom-3 after:left-0 after:h-0.5 after:w-full after:origin-center after:rounded-full after:bg-[#171717] after:transition-transform dark:after:bg-white ${
                  active
                    ? 'text-[#171717] after:scale-x-100 dark:text-white'
                    : 'hover:text-[#171717] after:scale-x-0 hover:after:scale-x-100 dark:hover:text-white'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-0.1 sm:gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {!isLoginPage && !isRegisterPage && <LoginButton />}
          <button
            type="button"
            onClick={() => setMobileOpen(open => !open)}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-500 hover:bg-neutral-100 hover:text-slate-900 dark:hover:bg-neutral-800 dark:hover:text-white md:hidden"
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
            {navLinks.map(link => {
              const active = isActiveLink(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`border-l-2 px-3 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-[#171717] bg-neutral-100 text-[#171717] dark:border-white dark:bg-neutral-900 dark:text-white'
                      : 'border-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
