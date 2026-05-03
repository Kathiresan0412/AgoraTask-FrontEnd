"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, Tag } from "lucide-react";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { serviceTypeApi, ServiceTypeDto } from '@/lib/api';

export function Categories() {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';
  const [categories, setCategories] = useState<ServiceTypeDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setLoading(true);
      try {
        const { data } = await serviceTypeApi.list();
        if (!cancelled) setCategories(data.filter(category => category.active).slice(0, 8));
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-24 bg-white dark:bg-neutral-900 border-y border-neutral-200/50 dark:border-neutral-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#171717] dark:text-white">Explore Categories</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Find the right service provider for your specific needs</p>
          </div>
          <Link href={`/${country}/services`} className="hidden md:flex items-center gap-2 text-[#171717] dark:text-white font-semibold hover:gap-3 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-[#F9FAFB] p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-[#F9FAFB] p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
            No categories found.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map(cat => (
            <Link href={`/${country}/services?category=${encodeURIComponent(cat.name)}`} key={cat.id} className="group cursor-pointer flex flex-col items-center justify-center p-6 rounded-3xl border border-neutral-200/60 dark:border-neutral-800 bg-[#F9FAFB] dark:bg-neutral-950 hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all active:scale-95">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-3 bg-neutral-100 dark:bg-neutral-800">
                {cat.icon ? <span className="text-3xl">{cat.icon}</span> : <Tag className="w-8 h-8 text-neutral-500" />}
              </div>
              <span className="font-medium text-sm text-center text-[#171717] dark:text-white">{cat.name}</span>
            </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
