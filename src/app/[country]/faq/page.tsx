"use client";

import React from 'react';
import { SupportPageShell, faqCards } from '@/components/support/SupportPageShell';

const articles = [
  {
    title: 'How do I find a service provider?',
    body: 'Open Services, choose your category and location, then compare provider profiles, prices, service areas, and reviews before contacting or booking.',
  },
  {
    title: 'Can providers join AgoraTask?',
    body: 'Yes. Providers can create an account, submit business details, add services, and send services for admin review before they are shown publicly.',
  },
  {
    title: 'How are reviews handled?',
    body: 'Customer reviews for services and providers are stored in the review system. Admins can approve, hide, or delete reviews from the admin dashboard.',
  },
  {
    title: 'What locations does AgoraTask support?',
    body: 'AgoraTask currently supports country-aware service discovery for Sri Lanka and Canada, including province, district or region, and city filters.',
  },
  {
    title: 'Can I message a provider before booking?',
    body: 'Yes. Logged-in customers can use messages to discuss details, availability, and expectations before confirming a service.',
  },
  {
    title: 'What if a service price says quote?',
    body: 'Quote-based services depend on job scope. Message the provider with photos, timing, and location details so they can give a clearer estimate.',
  },
];

export default function FaqPage() {
  return (
    <SupportPageShell
      eyebrow="AgoraTask Help"
      title="AgoraTask Support"
      subtitle="Find quick answers about booking, provider accounts, reviews, payments, and service discovery."
      searchPlaceholder="How can we help you today?"
      cards={faqCards}
      articles={articles}
    />
  );
}
