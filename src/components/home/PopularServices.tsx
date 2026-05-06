"use client";

import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, ImageIcon, MapPin, Sparkles, Star, Tags } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { publicServiceApi, PublicServiceDto } from '@/lib/api';
import { formatServicePrice } from '@/lib/countries';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

const formatDuration = (minutes?: number | null) => {
  if (!minutes) return 'Flexible';
  if (minutes < 60) return `${minutes} min`;

  const hours = minutes / 60;
  const formatted = Number.isInteger(hours) ? String(hours) : String(Number(hours.toFixed(1)));
  return `${formatted} hr`;
};

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

  if (!loading && (error || services.length === 0)) {
    return null;
  }

  return (
    <section className="py-24 px-4 bg-[#F9FAFB] dark:bg-neutral-950">
      <div className="container mx-auto">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
              {t('services.recommended')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#171717] dark:text-white">{t('home.popularServices')}</h2>
          </div>
          <Link href={`/${country}/services`} className="inline-flex items-center gap-2 font-semibold text-[#171717] transition-all hover:gap-3 dark:text-white">
            {t('home.viewAll')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4" aria-label={t('common.loading')}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-neutral-200/60 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <Skeleton className="h-48 w-full rounded-none" />
                <div className="space-y-4 p-6">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-4/5" />
                  <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map(service => {
              const primaryCategory = service.serviceTypes[0]?.name || service.categories[0] || 'Service';
              const visibleArea = service.serviceArea[0] || service.location || 'Local area';

              return (
                <Link href={`/${country}/services/${service.id}`} key={service.id} className="group flex overflow-hidden rounded-2xl border border-neutral-200/70 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="relative h-48 overflow-hidden">
                      {service.images[0] ? (
                        <Image src={service.images[0]} alt={service.title} fill sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-[#171717] shadow-sm backdrop-blur-sm dark:bg-neutral-950/90 dark:text-white">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        {t('services.new')}
                      </div>
                      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 text-white">
                        {service.provider.profileImage ? (
                          <Image src={service.provider.profileImage} alt="" width={36} height={36} className="h-9 w-9 rounded-full border border-white/60 object-cover" unoptimized />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/20 text-sm font-bold backdrop-blur">
                            {service.provider.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{service.provider.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-white/80">
                            <Tags className="h-3 w-3 shrink-0" />
                            {primaryCategory}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-2 text-lg font-bold leading-snug text-[#171717] transition-colors group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">{service.title}</h3>
                      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                        {service.description || `Book ${primaryCategory.toLowerCase()} support from a local provider.`}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                        <span className="flex min-w-0 items-center gap-1.5 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-950">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className="truncate">{visibleArea}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-950">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                          <span className="truncate">{formatDuration(service.durationMins)}</span>
                        </span>
                      </div>

                      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800">
                        <span className="text-lg font-extrabold text-[#171717] dark:text-white">{formatServicePrice(service.basePrice, service.priceType, country)}</span>
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171717] text-white transition-transform group-hover:translate-x-1 dark:bg-white dark:text-[#171717]">
                          <ArrowRight className="h-5 w-5 -rotate-45" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
