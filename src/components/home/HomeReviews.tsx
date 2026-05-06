"use client";

import React from 'react';
import { CheckCircle, ShieldCheck, Sparkles, Star } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Nethmi Perera',
    role: 'Home cleaning customer',
    rating: 5,
    text: 'The provider arrived on time, explained the price clearly, and finished the job with photos before leaving.',
  },
  {
    name: 'Arun Sivakumar',
    role: 'Electrical repair customer',
    rating: 5,
    text: 'I could compare details, send a message, and book without calling ten different people. The review trail helped a lot.',
  },
  {
    name: 'Michelle Fernando',
    role: 'Event support customer',
    rating: 4,
    text: 'The assistant helped narrow the category and the admin-approved reviews made the shortlist feel trustworthy.',
  },
];

const STEPS = [
  'Customer or guest writes a review',
  'Admin checks the review queue',
  'Approved reviews appear publicly',
];

export function HomeReviews() {
  return (
    <section className="overflow-hidden bg-white py-20 dark:bg-neutral-950">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="home-review-reveal">
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Admin approved reviews
            </div> */}
            <h2 className="mt-5 text-3xl font-black tracking-tight text-neutral-950 dark:text-white md:text-5xl">
              Real feedback, checked before it goes live.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
              Logged-in customers can submit reviews. New reviews wait in the admin queue, then approved reviews show on provider and service pages.
            </p>
            <div className="mt-8 grid gap-3">
              {STEPS.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-sm font-black text-white dark:bg-white dark:text-neutral-950">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-100">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:items-stretch">
            {REVIEWS.map((review, index) => (
              <article
                key={review.name}
                className="home-review-card rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex gap-1 text-amber-500" aria-label={`${review.rating} star review`}>
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star key={starIndex} className={`h-4 w-4 ${starIndex < review.rating ? 'fill-amber-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
                    ))}
                  </div>
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="min-h-32 text-sm leading-6 text-neutral-700 dark:text-neutral-300">{review.text}</p>
                <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 fill-emerald-500 text-white" />
                    <div>
                      <p className="text-sm font-black text-neutral-950 dark:text-white">{review.name}</p>
                      <p className="text-xs font-semibold text-neutral-500">{review.role}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
