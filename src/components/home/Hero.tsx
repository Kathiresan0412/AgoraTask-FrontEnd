import React from 'react';
import { Search, MapPin, ArrowRight, ShieldCheck, Clock, Star } from "lucide-react";
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative pt-24 pb-32 overflow-hidden px-4">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-sm font-medium mb-8 border border-neutral-200 dark:border-neutral-800">
          <Star className="w-4 h-4 fill-[#171717] dark:fill-white text-[#171717] dark:text-white" />
          <span>Verified Local Professionals</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-[#171717] dark:text-white">
          A sharper way to find <span className="text-neutral-500">dependable</span> local providers.
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          AgoraTask helps customers discover trusted specialists for home, learning, wellness, and business support with a cleaner, faster path from search to shortlist.
        </p>
        
        {/* Search Bar */}
        <div className="bg-white dark:bg-neutral-900 p-2 rounded-full shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-neutral-500 shrink-0 pointer-events-none" />
            <input 
              type="text" 
              placeholder="What service do you need?" 
              className="w-full px-5 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-200 outline-none pl-11 bg-transparent border-none text-[#171717] dark:text-white placeholder:text-neutral-400"
            />
          </div>
          <div className="hidden md:block w-px bg-neutral-200 dark:bg-neutral-800 my-2"></div>
          <div className="flex-1 relative flex items-center">
            <MapPin className="w-5 h-5 absolute left-4 text-neutral-500 shrink-0 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Colombo, Sri Lanka" 
              className="w-full px-5 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-200 outline-none pl-11 bg-transparent border-none text-[#171717] dark:text-white placeholder:text-neutral-400"
            />
          </div>
          <Link href="/services" className="bg-[#171717] hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-[#171717] px-8 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 group w-full md:w-auto">
            Search
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        
        <div className="mt-10 flex items-center justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400 font-medium flex-wrap">
          <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Verified Pros</div>
          <div className="flex items-center gap-2"><Clock className="w-5 h-5" /> Instant Booking</div>
          <div className="flex items-center gap-2"><Star className="w-5 h-5" /> Transparent Reviews</div>
        </div>
      </div>
    </section>
  );
}
