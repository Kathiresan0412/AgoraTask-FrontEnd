"use client";

import React from 'react';
import { SupportPageShell } from '@/components/support/SupportPageShell';

const articles = [
  {
    title: 'How to choose the right home service provider',
    body: 'Start with the category, check the service area, compare provider details, and read reviews before sending a message or booking.',
  },
  {
    title: 'What to include when requesting a quote',
    body: 'Share the location, preferred time, photos where useful, budget expectations, and any special instructions so providers can reply with a better estimate.',
  },
  {
    title: 'A better provider profile gets better leads',
    body: 'Providers should keep descriptions specific, add service images, choose accurate categories, and explain pricing clearly to help customers decide faster.',
  },
  {
    title: 'Why location filters matter',
    body: 'Country-aware province, district, region, and city filters help customers avoid providers outside their service area and reduce wasted conversations.',
  },
  {
    title: 'Building trust with reviews',
    body: 'Thoughtful reviews help future customers understand punctuality, communication, quality, and whether the listed service matched the actual work.',
  },
];

export default function BlogPage() {
  return (
    <SupportPageShell
      eyebrow="AgoraTask Blog"
      title="Service Marketplace Guides"
      subtitle="Practical articles for customers choosing services and providers growing their work on AgoraTask."
      searchPlaceholder="Search blog articles"
      articles={articles}
      ctaLabel="Find a service"
    />
  );
}
