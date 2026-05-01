"use client";

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Clock, MapPin, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import CustomerAssistant from '@/components/chat/CustomerAssistant';

export default function UserDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const country = params?.country as string || 'lk';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 max-w-5xl py-12">
        <div className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name || 'Customer'}!
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
              Profile
            </Link>
            <Link href={`/${country}/services`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full shadow-sm text-sm">
              Book New Service
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-slate-50/50 dark:bg-slate-900">
            <button className="px-6 py-4 font-bold text-indigo-600 border-b-2 border-indigo-600">Upcoming Bookings</button>
            <button className="px-6 py-4 font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">Past Bookings</button>
            <button className="px-6 py-4 font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">Reviews & Ratings</button>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="mb-6 flex justify-between items-center relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input type="text" className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64" placeholder="Search bookings..."/>
            </div>

            <div className="space-y-4">
              {/* Booking Card */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-lg transition-all bg-white dark:bg-slate-900 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 group-hover:w-2 transition-all"></div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/40 dark:to-indigo-800/20 text-indigo-700 dark:text-indigo-300 w-20 h-20 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                  <span className="text-xs font-bold uppercase tracking-wider">Oct</span>
                  <span className="text-3xl font-black">24</span>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">AC Maintenance & Repair</h3>
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">In Progress</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-medium mb-4 text-sm">Provider: <Link href="/providers/colombo-cleaners" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer">CoolTech Solutions</Link></div>
                  
                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md"><Clock className="w-4 h-4 text-slate-400"/> 14:00 - 16:00</div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md"><MapPin className="w-4 h-4 text-slate-400"/> 123 Main St, Colombo 03</div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-3 w-full md:w-32 mt-4 md:mt-0 shrink-0">
                  <button className="flex-1 md:flex-none border border-slate-200 dark:border-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Reschedule</button>
                  <Link href="/services" className="flex-1 md:flex-none bg-indigo-600 shadow-md shadow-indigo-600/20 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors text-center block">View Details</Link>
                </div>
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
