"use client";

import React from 'react';
import { ArrowRight } from "lucide-react";
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function ProviderCTA() {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';

  return (
    <section className="py-32 px-4 bg-[#171717] dark:bg-black relative overflow-hidden">
      <div className="container mx-auto max-w-4xl text-center text-white relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Are you a Service Provider?</h2>
        <p className="text-neutral-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Join AgoraTask today. Grow your business, manage bookings, and reach thousands of new customers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={`/${country}/register?role=provider`} className="bg-white text-[#171717] hover:bg-neutral-200 px-8 py-4 rounded-full font-bold text-lg transition-all active:scale-95 flex items-center justify-center">
            Register as a Professional
          </Link>
          <Link href={`/${country}/services`} className="bg-transparent hover:bg-neutral-800 border border-neutral-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2">
            Learn More <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
