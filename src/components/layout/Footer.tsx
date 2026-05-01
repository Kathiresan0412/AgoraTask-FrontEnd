"use client";

import React from 'react';
import { Zap } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-[#171717] dark:bg-black text-neutral-400 py-12 px-4 border-t border-neutral-800 dark:border-neutral-900">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-white" />
          <span className="text-xl font-bold tracking-tight">AgoraTask</span>
        </div>
        <p className="text-sm">© {(new Date().getFullYear())} AgoraTask. {t('footer.allRightsReserved')}</p>
      </div>
    </footer>
  );
}
