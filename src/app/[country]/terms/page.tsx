"use client";

import React from 'react';
import { SupportPageShell } from '@/components/support/SupportPageShell';

const articles = [
  {
    title: 'Using AgoraTask',
    body: 'AgoraTask is a service marketplace where customers discover providers and providers manage service listings. Users should provide accurate account and service information.',
  },
  {
    title: 'Customer responsibilities',
    body: 'Customers should describe the requested work clearly, communicate respectfully, keep booking details accurate, and use reviews to share genuine experiences.',
  },
  {
    title: 'Provider responsibilities',
    body: 'Providers are responsible for accurate listings, fair communication, service quality, availability, and following applicable local rules for their work.',
  },
  {
    title: 'Reviews and moderation',
    body: 'AgoraTask may moderate reviews, service listings, provider profiles, messages, and accounts to reduce abuse and keep marketplace information useful.',
  },
  {
    title: 'Changes to service',
    body: 'AgoraTask may update features, policies, availability, and support content as the marketplace grows across supported countries.',
  },
];

export default function TermsPage() {
  return (
    <SupportPageShell
      eyebrow="Terms"
      title="AgoraTask Terms"
      subtitle="Marketplace rules for customers, providers, service listings, messages, bookings, and reviews."
      searchPlaceholder="Search terms"
      articles={articles}
      ctaLabel="Browse marketplace"
    />
  );
}
