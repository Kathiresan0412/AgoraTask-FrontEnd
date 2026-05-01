"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import ta from '@/locales/ta.json';
import si from '@/locales/si.json';

export type Language = 'en' | 'ta' | 'si';

type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Translations> = {
  en,
  ta,
  si,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved language preference on mount
    const savedLang = localStorage.getItem('agoratask_lang') as Language;
    if (savedLang && ['en', 'ta', 'si'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agoratask_lang', lang);
  };

  // Helper function to get translation by dot-notation key (e.g., "common.login")
  const t = (keyString: string): string => {
    const keys = keyString.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current[key] === undefined) {
        // Fallback to English if translation is missing
        let fallback: any = translations['en'];
        for (const fbKey of keys) {
          if (fallback[fbKey] === undefined) return keyString; // Return key if not found in fallback
          fallback = fallback[fbKey];
        }
        return fallback;
      }
      current = current[key];
    }

    return current as string;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>; 
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
