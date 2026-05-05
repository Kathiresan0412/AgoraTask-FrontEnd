"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MessagesPanel } from '@/components/chat/MessagesPanel';

export default function MessagesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="min-h-0 flex-1">
        <div className="mx-auto h-[calc(100vh-5.25rem)] min-h-[520px] max-w-7xl overflow-hidden border-x border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <MessagesPanel />
        </div>
      </main>
    </div>
  );
}
