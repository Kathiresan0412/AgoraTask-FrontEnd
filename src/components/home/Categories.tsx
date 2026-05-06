"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, Layers, Tag } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { serviceTypeApi, ServiceTypeDto } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const CATEGORY_LIMIT = 10;

const isImageSource = (value?: string | null) =>
  Boolean(value && (/^https?:\/\//.test(value) || value.startsWith('/') || value.startsWith('data:image/')));

const getCategoryImage = (category: ServiceTypeDto) =>
  category.image_url || category.imageUrl || (isImageSource(category.icon) ? category.icon : null);

export function Categories() {
  const params = useParams<{ country?: string }>();
  const { t } = useLanguage();
  const country = params.country || 'lk';
  const [categories, setCategories] = useState<ServiceTypeDto[]>([]);
  const [childCounts, setChildCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [categoryRail, setCategoryRail] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      setLoading(true);
      try {
        const { data } = await serviceTypeApi.list();
        if (!cancelled) {
          const activeCategories = data.filter(category => category.active);
          const counts = activeCategories.reduce<Record<string, number>>((groups, category) => {
            if (!category.parent_id) return groups;
            return {
              ...groups,
              [category.parent_id]: (groups[category.parent_id] || 0) + 1,
            };
          }, {});

          setChildCounts(counts);
          setCategories(activeCategories.filter(category => !category.parent_id).slice(0, CATEGORY_LIMIT));
        }
      } catch {
        if (!cancelled) {
          setCategories([]);
          setChildCounts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!categoryRail || categories.length === 0) return;

    const interval = window.setInterval(() => {
      const maxScroll = categoryRail.scrollWidth - categoryRail.clientWidth;
      if (maxScroll <= 0) return;

      const nearEnd = categoryRail.scrollLeft >= maxScroll - 12;
      categoryRail.scrollTo({
        left: nearEnd ? 0 : categoryRail.scrollLeft + 220,
        behavior: 'smooth',
      });
    }, 2600);

    return () => window.clearInterval(interval);
  }, [categories.length, categoryRail]);

  if (loading || categories.length === 0) {
    return null;
  }

  return (
    <section className="py-24 bg-white dark:bg-neutral-900 border-y border-neutral-200/50 dark:border-neutral-800/50">
      <div className="container mx-auto px-4 lg:pl-12 xl:pl-20">
        <div className="flex items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#171717] dark:text-white">
              {t('home.categories.title')}
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">{t('home.categories.subtitle')}</p>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link href={`/${country}/services`} className="flex items-center gap-2 text-[#171717] dark:text-white font-semibold hover:gap-3 transition-all">
              {t('home.categories.viewAll')} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div
          ref={setCategoryRail}
          className="-mx-4 flex snap-x gap-4 overflow-x-auto scroll-smooth px-4 pb-3 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.map(cat => {
            const image = getCategoryImage(cat);
            const childCount = childCounts[cat.id] || 0;

            return (
              <Link href={`/${country}/services?category=${encodeURIComponent(cat.name)}`} key={cat.id} className="group flex min-h-44 w-[72vw] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/70 bg-[#F9FAFB] p-4 transition-all hover:-translate-y-1 hover:border-neutral-300 hover:bg-white hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] active:scale-95 sm:w-56 lg:w-48 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700 dark:hover:bg-neutral-900">
                <div className="flex items-start justify-between gap-2">
                  <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200/70 transition-transform group-hover:scale-105 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800">
                    {image ? (
                      <Image src={image} alt="" fill sizes="56px" className="object-cover" unoptimized />
                    ) : cat.icon ? (
                      <span className="text-2xl leading-none">{cat.icon}</span>
                    ) : (
                      <Tag className="h-6 w-6" />
                    )}
                  </div>
                  {childCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <Layers className="h-3 w-3" />
                      {childCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 pt-5">
                  <span className="block text-sm font-bold leading-snug text-[#171717] dark:text-white">{cat.name}</span>
                  <span className="mt-2 line-clamp-2 block text-xs leading-5 text-neutral-500 dark:text-neutral-400">
                    {cat.description || (childCount > 0 ? `${childCount} service types` : t('home.categories.subtitle'))}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <Link href={`/${country}/services`} className="mt-5 flex items-center gap-2 font-semibold text-[#171717] dark:text-white md:hidden">
          {t('home.categories.viewAll')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
