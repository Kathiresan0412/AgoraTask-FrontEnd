"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#171717] selection:bg-neutral-200 dark:bg-neutral-950 dark:text-neutral-100 dark:selection:bg-neutral-800">
      <Navbar />
      <main>
        <section className="border-b border-neutral-200/70 bg-white px-4 py-20 dark:border-neutral-800/70 dark:bg-neutral-950">
          <div className="container mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
              {t('common.appName')}
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              {t('about.title')}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
              {t('about.subtitle')}
            </p>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="container mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-bold">{t('about.customersTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {t('about.customersText')}
              </p>
            </article>
            <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-bold">{t('about.providersTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {t('about.providersText')}
              </p>
            </article>
            <article className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <h2 className="text-lg font-bold">{t('about.trustTitle')}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                {t('about.trustText')}
              </p>
            </article>
          </div>
        </section>

        <section className="bg-[#171717] px-4 py-14 text-white dark:bg-black">
          <div className="container mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{t('about.ctaTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-300">{t('about.ctaText')}</p>
            </div>
            <Link
              href={`/${country}/services`}
              className="inline-flex w-fit items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#171717] transition-colors hover:bg-neutral-200"
            >
              {t('about.ctaButton')}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
