"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, ImageIcon, Star } from "lucide-react";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { publicServiceApi, PublicServiceDto } from '@/lib/api';
import { formatServicePrice } from '@/lib/countries';
import { useLanguage } from '@/contexts/LanguageContext';

export function PopularServices() {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';
  const { t } = useLanguage();
  const [services, setServices] = useState<PublicServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await publicServiceApi.list({ page: 1, limit: 4 });
        if (!cancelled) setServices(data.data);
      } catch {
        if (!cancelled) setError('Could not load services from the API.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadServices();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-24 px-4 bg-[#F9FAFB] dark:bg-neutral-950">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#171717] dark:text-white">{t('home.popularServices')}</h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg">Services are loaded from the marketplace API.</p>
        </div>

        {error && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            {t('common.loading')}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            {t('common.noResults')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map(service => (
            <Link href={`/${country}/services/${service.id}`} key={service.id} className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 group hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                {service.images[0] ? (
                  <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 text-[#171717] dark:text-white">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>New</span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">{service.provider.name}</div>
                <h3 className="text-xl font-bold mb-4 line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors text-[#171717] dark:text-white">{service.title}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-[#171717] dark:text-white text-lg">{formatServicePrice(service.basePrice, service.priceType, country)}</span>
                  <div className="w-10 h-10 rounded-full bg-[#F9FAFB] dark:bg-neutral-800 flex items-center justify-center text-[#171717] dark:text-white group-hover:bg-[#171717] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-[#171717] transition-colors">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </div>
            </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
