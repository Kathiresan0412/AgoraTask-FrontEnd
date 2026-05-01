import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { PopularServices } from '@/components/home/PopularServices';
import { ProviderCTA } from '@/components/home/ProviderCTA';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-neutral-950 font-sans text-[#171717] dark:text-neutral-100 selection:bg-neutral-200 dark:selection:bg-neutral-800">
      <Navbar />
      <Hero />
      <Categories />
      <PopularServices />
      <ProviderCTA />
      <Footer />
    </div>
  );
}
