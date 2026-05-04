"use client";

import React from 'react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[#171717] dark:bg-black text-neutral-400 py-12 px-4 border-t border-neutral-800 dark:border-neutral-900">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <Image src="/agoratask-icon.svg" alt="AgoraTask" width={24} height={24} className="block h-full w-full object-contain" />
          </span>
          <span className="text-xl font-bold tracking-tight">AgoraTask</span>
        </div>
        <p className="text-sm">© {(new Date().getFullYear())} AgoraTask. {t('footer.allRightsReserved')}</p>
      </div>
    </footer>
  );
}
