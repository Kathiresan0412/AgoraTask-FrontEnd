"use client";

import React, { createContext, useContext, useState } from 'react';
import en from '@/locales/en.json';
import ta from '@/locales/ta.json';
import si from '@/locales/si.json';

export type Language = 'en' | 'ta' | 'si';

type Translations = typeof en;
type TranslationNode = string | { [key: string]: TranslationNode };

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
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const savedLang = window.localStorage.getItem('agoratask_lang') as Language | null;
    return savedLang && ['en', 'ta', 'si'].includes(savedLang) ? savedLang : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('agoratask_lang', lang);
  };

  // Helper function to get translation by dot-notation key (e.g., "common.login")
  const t = (keyString: string): string => {
    const keys = keyString.split('.');
    let current: TranslationNode = translations[language];

    for (const key of keys) {
      if (typeof current === 'string' || current[key] === undefined) {
        // Fallback to English if translation is missing
        let fallback: TranslationNode = translations['en'];
        for (const fbKey of keys) {
          if (typeof fallback === 'string' || fallback[fbKey] === undefined) return keyString; // Return key if not found in fallback
          fallback = fallback[fbKey];
        }
        return typeof fallback === 'string' ? fallback : keyString;
      }
      current = current[key];
    }

    return typeof current === 'string' ? current : keyString;
  };

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
