import React from 'react';
import { Droplets, Zap, Scissors, Wrench, Sprout, Bug, BookOpen, ArrowRight } from "lucide-react";
import Link from 'next/link';

export function Categories() {
  const categories = [
    { name: 'Cleaning', icon: <Droplets className="w-8 h-8 text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Plumbing', icon: <Wrench className="w-8 h-8 text-cyan-500" />, color: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { name: 'Electrical', icon: <Zap className="w-8 h-8 text-amber-500" />, color: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Beauty', icon: <Scissors className="w-8 h-8 text-pink-500" />, color: 'bg-pink-50 dark:bg-pink-900/20' },
    { name: 'Repairs', icon: <Wrench className="w-8 h-8 text-purple-500" />, color: 'bg-purple-50 dark:bg-purple-900/20' },
    { name: 'Pest Control', icon: <Bug className="w-8 h-8 text-red-500" />, color: 'bg-red-50 dark:bg-red-900/20' },
    { name: 'Tutoring', icon: <BookOpen className="w-8 h-8 text-orange-500" />, color: 'bg-orange-50 dark:bg-orange-900/20' },
    { name: 'Gardening', icon: <Sprout className="w-8 h-8 text-green-500" />, color: 'bg-green-50 dark:bg-green-900/20' },
  ];

  return (
    <section className="py-24 bg-white dark:bg-neutral-900 border-y border-neutral-200/50 dark:border-neutral-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#171717] dark:text-white">Explore Categories</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Find the right service provider for your specific needs</p>
          </div>
          <Link href="/services" className="hidden md:flex items-center gap-2 text-[#171717] dark:text-white font-semibold hover:gap-3 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((cat, i) => (
            <Link href="/services" key={i} className="group cursor-pointer flex flex-col items-center justify-center p-6 rounded-3xl border border-neutral-200/60 dark:border-neutral-800 bg-[#F9FAFB] dark:bg-neutral-950 hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all active:scale-95">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-3 ${cat.color}`}>
                {cat.icon}
              </div>
              <span className="font-medium text-sm text-center text-[#171717] dark:text-white">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
