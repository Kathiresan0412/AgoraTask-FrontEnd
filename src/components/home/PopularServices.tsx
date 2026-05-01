import React from 'react';
import { Star, ArrowRight } from "lucide-react";
import Link from 'next/link';

export function PopularServices() {
  const popularServices = [
    {
      title: "Deep House Cleaning",
      provider: "Colombo Cleaners",
      rating: 4.8,
      reviews: 124,
      price: "From Rs. 3500",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "AC Repair & Maintenance",
      provider: "CoolTech Solutions",
      rating: 4.9,
      reviews: 89,
      price: "From Rs. 2000",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Emergency Plumbing",
      provider: "QuickFix Plumbers",
      rating: 4.7,
      reviews: 210,
      price: "From Rs. 1500",
      image: "https://images.unsplash.com/photo-1607472586893-edb57cbceb42?q=80&w=600&auto=format&fit=crop"
    },
    {
      title: "Bridal Makeup",
      provider: "Glamour Salon",
      rating: 5.0,
      reviews: 56,
      price: "Quote",
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?q=80&w=600&auto=format&fit=crop"
    }
  ];

  return (
    <section className="py-24 px-4 bg-[#F9FAFB] dark:bg-neutral-950">
      <div className="container mx-auto">
        <div className="flex flex-col items-center text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-[#171717] dark:text-white">Popular Services</h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl text-lg">Top-rated services booked by people around you.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {popularServices.map((service, i) => (
            <Link href="/providers/colombo-cleaners" key={i} className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 group hover:shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/60 to-transparent z-10"></div>
                <img src={service.image} alt={service.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute bottom-4 left-4 z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 text-[#171717] dark:text-white">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{service.rating}</span>
                  <span className="text-neutral-500 font-normal">({service.reviews})</span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">{service.provider}</div>
                <h3 className="text-xl font-bold mb-4 line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors text-[#171717] dark:text-white">{service.title}</h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-bold text-[#171717] dark:text-white text-lg">{service.price}</span>
                  <div className="w-10 h-10 rounded-full bg-[#F9FAFB] dark:bg-neutral-800 flex items-center justify-center text-[#171717] dark:text-white group-hover:bg-[#171717] group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-[#171717] transition-colors">
                    <ArrowRight className="w-5 h-5 -rotate-45" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
