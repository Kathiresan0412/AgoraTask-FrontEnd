"use client";

import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, ThemePreference } from '@/contexts/ThemeContext';

const options: { value: ThemePreference; label: string; icon: React.ElementType }[] = [
  { value: 'system', label: 'System theme', icon: Monitor },
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const currentIndex = options.findIndex(option => option.value === theme);
  const CurrentIcon = options[Math.max(currentIndex, 0)].icon;

  const cycleTheme = () => {
    const next = options[(Math.max(currentIndex, 0) + 1) % options.length];
    setTheme(next.value);
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
      aria-label={options[Math.max(currentIndex, 0)].label}
      title={options[Math.max(currentIndex, 0)].label}
    >
      <CurrentIcon className="h-4 w-4" />
    </button>
  );
}
