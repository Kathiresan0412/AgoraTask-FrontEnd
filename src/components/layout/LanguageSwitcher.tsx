"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage, Language } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; native: string } = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium text-neutral-700 dark:text-neutral-300"
        title={t('common.language')}
      >
        <Globe className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
        <span className="hidden sm:inline-block">{currentLang.native}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-lg py-2 z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                language === lang.code ? 'text-[#171717] dark:text-white font-semibold' : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-center">{language === lang.code && <Check className="w-4 h-4 text-green-600 dark:text-green-500" />}</span>
                <span>{lang.native}</span>
                <span className="text-xs text-neutral-400 ml-1">({lang.label})</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
