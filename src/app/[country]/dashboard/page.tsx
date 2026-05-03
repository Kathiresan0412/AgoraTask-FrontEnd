"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Search, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import CustomerAssistant from '@/components/chat/CustomerAssistant';
import { useLanguage } from '@/contexts/LanguageContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 max-w-5xl py-12">
        <div className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {t('dashboard.welcome')}, {user?.name || 'Customer'}!
            </h1>
            <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/${country}/profile`}
              className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2 px-5 rounded-full text-sm transition-colors"
            >
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4" />
              )}
              {t('nav.profile')}
            </Link>
            <Link href={`/${country}/services`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full shadow-sm text-sm">
              {t('dashboard.findService')}
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-slate-50/50 dark:bg-slate-900">
            <button className="px-6 py-4 font-bold text-indigo-600 border-b-2 border-indigo-600">{t('dashboard.recentBookings')}</button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="mb-6 flex justify-between items-center relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input type="text" className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64" placeholder={t('common.search')}/>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                Booking records will appear here when the bookings API returns customer data.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      <CustomerAssistant />
    </div>
  );
}
