import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Star, MapPin, CheckCircle, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ProviderProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />
      
      {/* Cover Image */}
      <div className="w-full h-64 md:h-80 relative bg-slate-800">
        <img 
          src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2000&auto=format&fit=crop" 
          alt="Provider cover" 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-24 relative z-10 pb-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800">
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden bg-white shrink-0 shadow-lg -mt-16 md:-mt-20">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Colombo Cleaners</h1>
                <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500/20" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">Professional home and office cleaning services.</p>
              
              <div className="flex flex-wrap gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                  <Star className="w-4 h-4 fill-amber-500" /> 4.9 (428 reviews)
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4" /> Colombo District
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full border border-green-200/50 dark:border-green-800/50">
                  <Shield className="w-4 h-4" /> Verified Background
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
              <Link href="/dashboard" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 text-center block">
                Book Now
              </Link>
              <button className="w-full md:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95">
                Message
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Available Services</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(item => (
                <div key={item} className="group border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-900 transition-all cursor-pointer flex flex-col h-full">
                  <div className="mb-4 bg-white dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                    <CheckCircle className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="font-bold text-xl mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Deep Home Cleaning</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Complete deep cleaning of all rooms including bathrooms, kitchens, and living spaces.</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-800">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">Rs. 5,000</span>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3"/> 4 hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
      <Footer />
    </div>
  );
}
