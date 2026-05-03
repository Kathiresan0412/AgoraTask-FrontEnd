"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import { publicServiceApi } from '@/lib/api';
import type { PublicServiceDto } from '@/lib/api';
import { AlertCircle, CheckCircle, Clock, ImageIcon, MapPin, Shield, Star, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatServicePrice } from '@/lib/countries';

type Review = {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  date: string;
};

const loadSavedReviews = (serviceId: string) => {
  if (typeof window === 'undefined') return [];

  const saved = window.localStorage.getItem(`agoratask_service_reviews_${serviceId}`);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as Review[];
  } catch {
    return [];
  }
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return 'Flexible';
  if (minutes < 60) return `${minutes} mins`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
};

export default function ServiceDetailPage() {
  const params = useParams<{ country?: string; slug?: string }>();
  const country = params.country || 'lk';
  const slug = params.slug || '';
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState<PublicServiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadService = async () => {
      setIsLoading(true);
      setError('');
      try {
        const { data } = await publicServiceApi.getService(slug);
        if (cancelled) return;

        setService(data);
        setReviews(loadSavedReviews(data.id));
      } catch {
        if (!cancelled) {
          setError('Could not load this service from the API.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (slug) {
      loadService();
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSubmitReview = () => {
    if (!service) return;

    if (!user) {
      setReviewNotice('Please log in as a customer before leaving a review.');
      return;
    }

    if (user.role !== 'customer') {
      setReviewNotice('Only customer accounts can review booked services.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewNotice('Write a short review before submitting.');
      return;
    }

    const nextReview: Review = {
      id: crypto.randomUUID(),
      customer: user.name,
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    const nextReviews = [nextReview, ...reviews];
    setReviews(nextReviews);
    localStorage.setItem(`agoratask_service_reviews_${service.id}`, JSON.stringify(nextReviews));
    setReviewComment('');
    setReviewRating(5);
    setReviewNotice('Review added on this device. Backend should verify a completed booking before saving permanently.');
  };

  const handleBookService = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    router.push(`/${country}/dashboard`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="container mx-auto max-w-5xl px-4 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-bold">Loading service...</p>
            <p className="mt-2 text-sm text-slate-500">Fetching the service details from the API.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="container mx-auto max-w-5xl px-4 py-20">
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center dark:border-red-900 dark:bg-slate-900">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <p className="text-lg font-bold">Service not found</p>
            <p className="mt-2 text-sm text-slate-500">{error || 'No service matched this URL.'}</p>
            <Link href={`/${country}/services`} className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">
              Browse Services
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="h-72 bg-slate-200 md:h-96">
              {service.images[0] ? (
                <img src={service.images[0]} alt={service.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="p-6 md:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {service.categories.map(category => (
                  <span key={category} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300">
                    {category}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-amber-500" /> {averageRating} ({reviews.length} reviews)
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{service.title}</h1>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{service.description || 'This provider has not added a full service description yet.'}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-500">Price</p>
                  <p className="mt-2 text-lg font-black text-indigo-600 dark:text-indigo-400">{formatServicePrice(service.basePrice, service.priceType, country)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-500">Duration</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-black"><Clock className="h-4 w-4 text-indigo-500" /> {formatDuration(service.durationMins)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-500">Location</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-black"><MapPin className="h-4 w-4 text-indigo-500" /> {service.location || 'Flexible'}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase text-slate-500">Provider</p>
              <Link href={`/${country}/providers/${service.provider.slug}`} className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50 dark:border-slate-800 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  {service.provider.profileImage ? (
                    <img src={service.provider.profileImage} alt={service.provider.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <UserRound className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 dark:text-white">{service.provider.name}</p>
                  <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">View provider profile</p>
                </div>
              </Link>

              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                <Shield className="h-4 w-4" />
                Booked customers can review this service.
              </div>

              <button type="button" onClick={handleBookService} className="mt-5 block w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
                Book This Service
              </button>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold">Service Reviews</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Reviews should be connected to completed bookings for this service.</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-3xl font-black">{averageRating}</p>
              <p className="text-sm text-slate-500">{reviews.length} total reviews</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
                {reviews.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 p-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    Reviews will appear here when they are returned by the API.
                  </div>
                )}
                {reviews.map(review => (
                <div key={review.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{review.customer}</p>
                      <p className="text-xs text-slate-500">{review.date}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                      <Star className="h-4 w-4 fill-amber-500" />
                      {review.rating}
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <h3 className="mb-4 text-lg font-bold">Leave a Review</h3>
              <div className="mb-4 flex gap-1">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button key={rating} onClick={() => setReviewRating(rating)} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20" aria-label={`${rating} star rating`}>
                    <Star className={`h-5 w-5 ${rating <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={event => setReviewComment(event.target.value)}
                rows={4}
                placeholder="Share how the booked service went"
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              />
              {reviewNotice && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{reviewNotice}</p>}
              <button onClick={handleSubmitReview} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900">
                <CheckCircle className="h-4 w-4" />
                Submit Review
              </button>
            </div>
          </div>
        </section>
      </main>

      <AuthRequiredModal
        country={country}
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => router.push(`/${country}/dashboard`)}
        title="Login to book this service"
        message="You need to be logged in before booking an authorized service."
      />
      <Footer />
    </div>
  );
}
