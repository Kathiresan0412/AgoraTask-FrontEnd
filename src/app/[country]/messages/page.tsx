"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MessagesPanel } from '@/components/chat/MessagesPanel';

export default function MessagesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-5xl px-4 py-8">
        <div className="h-[calc(100vh-140px)] min-h-[520px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <MessagesPanel />
        </div>
      </main>
    </div>
  );
}
