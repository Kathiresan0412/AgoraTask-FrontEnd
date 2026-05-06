"use client";

import React from 'react';
import { SupportPageShell } from '@/components/support/SupportPageShell';

const articles = [
  {
    title: 'Information we collect',
    body: 'AgoraTask may collect account details, profile information, service listings, messages, booking details, review content, and technical data needed to keep the marketplace reliable.',
  },
  {
    title: 'How information is used',
    body: 'We use data to operate accounts, show service listings, connect customers and providers, support moderation, improve safety, and maintain the customer experience.',
  },
  {
    title: 'Provider and service visibility',
    body: 'Provider profiles, approved services, public service details, and visible reviews may be shown to customers browsing the marketplace.',
  },
  {
    title: 'Messages and support',
    body: 'Messages help customers and providers coordinate work. Support or admin teams may review marketplace activity when needed for safety, moderation, or troubleshooting.',
  },
  {
    title: 'Your choices',
    body: 'You can update account details from your profile. If you need help with account, privacy, or review concerns, contact AgoraTask support from the help pages.',
  },
];

export default function PolicyPage() {
  return (
    <SupportPageShell
      eyebrow="Privacy Policy"
      title="AgoraTask Policy"
      subtitle="A clear view of how AgoraTask handles account, service, review, and marketplace information."
      searchPlaceholder="Search policy topics"
      articles={articles}
      ctaLabel="Explore services"
    />
  );
}
