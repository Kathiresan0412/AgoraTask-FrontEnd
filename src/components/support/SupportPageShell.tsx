"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, BookOpen, BriefcaseBusiness, CreditCard, FileText, HelpCircle, Search, ShieldCheck, UserCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

type SupportCard = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SupportArticle = {
  title: string;
  body: string;
};

type SupportPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  cards?: SupportCard[];
  articles: SupportArticle[];
  ctaLabel?: string;
};

const iconClass = "h-12 w-12 text-sky-500";

export const faqCards: SupportCard[] = [
  {
    title: 'General',
    description: 'How AgoraTask works for customers and providers.',
    icon: HelpCircle,
  },
  {
    title: 'On the Job',
    description: 'Booking, messaging, availability, and job expectations.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Payment & Fees',
    description: 'Pricing types, quotes, and payment-related questions.',
    icon: CreditCard,
  },
  {
    title: 'Account',
    description: 'Login, profiles, provider approval, and security.',
    icon: UserCircle,
  },
  {
    title: 'Policies',
    description: 'Terms, privacy, reviews, and service moderation.',
    icon: ShieldCheck,
  },
  {
    title: 'Guides',
    description: 'Helpful articles for getting better results on AgoraTask.',
    icon: BookOpen,
  },
];

export function SupportPageShell({
  eyebrow,
  title,
  subtitle,
  searchPlaceholder,
  cards,
  articles,
  ctaLabel = 'Browse services',
}: SupportPageShellProps) {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';
  const [query, setQuery] = useState('');

  const filteredArticles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return articles;

    return articles.filter(article =>
      `${article.title} ${article.body}`.toLowerCase().includes(normalized)
    );
  }, [articles, query]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#171717] selection:bg-neutral-200 dark:bg-neutral-950 dark:text-neutral-100 dark:selection:bg-neutral-800">
      <Navbar />
      <main>
        <section className="bg-white px-4 pb-28 pt-20 dark:bg-neutral-950">
          <div className="container mx-auto max-w-6xl">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-500">{eyebrow}</p>
            <div className="mt-24 text-center">
              <h1 className="text-4xl font-black tracking-tight text-neutral-950 dark:text-white md:text-6xl">{title}</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-500 dark:text-neutral-400">{subtitle}</p>
              <div className="mx-auto mt-10 flex max-w-3xl overflow-hidden rounded-lg border-2 border-sky-400 bg-white dark:bg-neutral-900">
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  className="min-w-0 flex-1 px-5 py-4 text-base text-neutral-900 outline-none dark:bg-neutral-900 dark:text-white"
                  placeholder={searchPlaceholder}
                />
                <button type="button" className="flex w-20 items-center justify-center bg-sky-400 text-white" aria-label="Search support content">
                  <Search className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {cards && (
          <section className="-mt-14 px-4 pb-16">
            <div className="container mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(card => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-lg shadow-neutral-950/5 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/30">
                      <Icon className={iconClass} />
                    </div>
                    <h2 className="mt-5 text-xl font-black text-neutral-950 dark:text-white">{card.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{card.description}</p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="px-4 py-16">
          <div className="container mx-auto grid max-w-6xl gap-5">
            {filteredArticles.map(article => (
              <article key={article.title} className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start gap-4">
                  <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-neutral-950 dark:text-white">{article.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-neutral-600 dark:text-neutral-300">{article.body}</p>
                  </div>
                </div>
              </article>
            ))}
            {filteredArticles.length === 0 && (
              <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                No support articles matched your search.
              </div>
            )}
          </div>
        </section>

        <section className="bg-neutral-950 px-4 py-14 text-white dark:bg-black">
          <div className="container mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Need a trusted professional?</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-300">Search services, compare providers, and message the right person before booking.</p>
            </div>
            <Link href={`/${country}/services`} className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-neutral-950 transition-colors hover:bg-neutral-200">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
