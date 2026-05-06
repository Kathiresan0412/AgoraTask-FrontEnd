"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CalendarDays, Clock, Search, User, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, usePathname, useRouter } from 'next/navigation';
import CustomerAssistant from '@/components/chat/CustomerAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { bookingApi, type BookingDto } from '@/lib/api';
import { formatServicePrice } from '@/lib/countries';
import { normalizeCountryCode } from '@/lib/locations';

const statusStyles: Record<BookingDto['status'], string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300',
  accepted: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300',
  declined: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300',
  completed: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300',
  cancelled: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const formatBookingTime = (value: string | null) => {
  if (!value) return 'Flexible';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UserDashboard() {
  const { user } = useAuth();
  const params = useParams();
  const country = params?.country as string || 'lk';
  const router = useRouter();
  const pathname = usePathname();
  const countryCode = normalizeCountryCode(country);
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace(`/${country}/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.role === 'provider') {
      router.replace(`/${country}/provider-dashboard`);
      return;
    }

    if (user.role === 'admin') {
      router.replace(`/${country}/admin`);
    }
  }, [country, pathname, router, user]);

  useEffect(() => {
    if (!user || user.role !== 'customer') return;

    let cancelled = false;
    const loadBookings = async () => {
      setIsLoadingBookings(true);
      setBookingError('');
      try {
        const { data } = await bookingApi.listMine();
        if (!cancelled) setBookings(data);
      } catch {
        if (!cancelled) setBookingError('Could not load your bookings.');
      } finally {
        if (!cancelled) setIsLoadingBookings(false);
      }
    };

    loadBookings();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredBookings = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return bookings;

    return bookings.filter(booking =>
      booking.serviceTitle.toLowerCase().includes(query) ||
      booking.providerName.toLowerCase().includes(query) ||
      booking.status.toLowerCase().includes(query)
    );
  }, [bookings, searchText]);

  if (!user || user.role !== 'customer') {
    return null;
  }

  const cancelBooking = async (bookingId: string) => {
    setUpdatingBookingId(bookingId);
    setBookingError('');
    try {
      const { data } = await bookingApi.cancel(bookingId);
      setBookings(current => current.map(booking => booking.id === bookingId ? data : booking));
    } catch {
      setBookingError('Could not cancel this booking.');
    } finally {
      setUpdatingBookingId(null);
    }
  };

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
              <input
                type="text"
                value={searchText}
                onChange={event => setSearchText(event.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full md:w-64"
                placeholder={t('common.search')}
              />
            </div>

            {bookingError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {bookingError}
              </div>
            )}

            <div className="space-y-4">
              {isLoadingBookings ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800" />
                ))
              ) : filteredBookings.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                  {t('dashboard.emptyBookings')}
                </div>
              ) : (
                filteredBookings.map(booking => (
                  <div key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyles[booking.status]}`}>
                            {booking.status}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {formatServicePrice(booking.amount, 'fixed', countryCode)}
                          </span>
                        </div>
                        <h3 className="truncate text-lg font-black text-slate-900 dark:text-white">{booking.serviceTitle}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">with {booking.providerName}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-indigo-500" />
                            {formatBookingTime(booking.scheduledTime)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-indigo-500" />
                            Requested {formatBookingTime(booking.createdAt)}
                          </span>
                        </div>
                      </div>
                      {['pending', 'accepted'].includes(booking.status) && (
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking.id)}
                          disabled={updatingBookingId === booking.id}
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          <XCircle className="h-4 w-4" />
                          {updatingBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      <CustomerAssistant />
    </div>
  );
}
