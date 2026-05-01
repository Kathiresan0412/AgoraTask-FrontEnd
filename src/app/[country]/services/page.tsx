import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Search, Filter, Star, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="bg-indigo-600 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Find Services</h1>
          <p className="text-indigo-100 text-lg max-w-2xl">Browse thousands of trusted professionals for all your home and business needs.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-12 flex-1 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-24">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-indigo-600" /> Filters
            </h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-3">
                {['Cleaning', 'Plumbing', 'Electrical', 'Beauty', 'Repairs'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 text-sm cursor-pointer group">
                    <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer" />
                    <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider mb-3">Price Range</h3>
              <input type="range" className="w-full accent-indigo-600 cursor-pointer" />
              <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                <span>Rs. 0</span>
                <span>Rs. 10k+</span>
              </div>
            </div>
            
            <button className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold py-3 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors active:scale-95">
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Showing <strong className="text-slate-900 dark:text-white">42</strong> results</span>
            <div className="relative">
              <select className="w-full px-5 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-200 outline-none pl-4 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm appearance-none">
                <option>Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Highest Rated</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(item => (
              <Link href="/providers/colombo-cleaners" key={item} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all cursor-pointer group flex flex-col h-full">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                    <img src={`https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80&auto=format&fit=crop&sig=${item}`} alt="service" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mb-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> 4.8 <span className="text-slate-400 font-normal">(120)</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Deep Cleaning Service</h3>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">Colombo Cleaners</div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white">Rs. 3,500</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm group-hover:underline">View details</span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
