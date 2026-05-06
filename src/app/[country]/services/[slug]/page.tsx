"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, publicServiceApi, reviewApi } from '@/lib/api';
import type { PublicServiceDto, ReviewDto } from '@/lib/api';
import { AlertCircle, CalendarDays, CheckCircle, Clock, ImageIcon, MapPin, Shield, Star, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatServicePrice } from '@/lib/countries';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { normalizeCountryCode } from '@/lib/locations';

type Review = {
  id: string;
  customer: string;
  customerEmail?: string;
  rating: number;
  comment: string;
  date: string;
  isMine?: boolean;
};

const formatReviewDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const mapReview = (review: ReviewDto): Review => {
  return {
    id: review.id,
    customer: review.customerName,
    customerEmail: review.customerEmail,
    rating: review.rating,
    comment: review.comment,
    date: formatReviewDate(review.updatedAt || review.createdAt),
    isMine: review.isMine,
  };
};

const getApiErrorMessage = (err: unknown) => {
  if (typeof err === 'object' && err && 'response' in err) {
    const response = (err as { response?: { data?: { error?: unknown } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return null;
};

const toDateTimeLocalValue = (date: Date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const getDefaultBookingTime = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return toDateTimeLocalValue(date);
};

function ServiceDetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]" aria-label="Loading service">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <Skeleton className="h-72 w-full rounded-none md:h-96" />
        <div className="space-y-6 p-6 md:p-8">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-full" />
          </div>
          <Skeleton className="h-12 w-4/5" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <aside className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <Skeleton className="h-3 w-20" />
          <div className="mt-3 flex items-center gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="mt-5 h-12 w-full rounded-xl" />
          <Skeleton className="mt-5 h-12 w-full rounded-xl" />
        </div>
      </aside>
    </div>
  );
}

export default function ServiceDetailPage() {
  const params = useParams<{ country?: string; slug?: string }>();
  const country = params.country || 'lk';
  const countryCode = normalizeCountryCode(country);
  const slug = params.slug || '';
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [service, setService] = useState<PublicServiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookingTime, setBookingTime] = useState(getDefaultBookingTime);
  const [bookingNotice, setBookingNotice] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadService = async () => {
      setIsLoading(true);
      setError('');
      try {
        const { data } = await publicServiceApi.getService(slug);
        if (cancelled) return;

        setService(data);
        const { data: apiReviews } = await reviewApi.listService(data.id);
        if (!cancelled) {
          setReviews(apiReviews.map(mapReview));
        }
      } catch {
        if (!cancelled) {
          setError(t('serviceDetail.loadError'));
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
  }, [slug, t]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const canManageReview = (review: Review) => Boolean(
    review.isMine || (user?.email && (review.customerEmail === user.email || (!review.customerEmail && review.customer === user.name)))
  );

  const userReview = reviews.find(canManageReview);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return t('serviceDetail.flexible');
    if (minutes < 60) return `${minutes} ${t('serviceDetail.minutesShort')}`;
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${t('serviceDetail.hoursShort')}`;
  };

  const resetReviewForm = () => {
    setReviewComment('');
    setReviewRating(5);
    setEditingReviewId(null);
    setIsReviewFormOpen(false);
  };

  const handleAddReview = () => {
    setReviewNotice('');
    setReviewComment('');
    setReviewRating(5);
    setEditingReviewId(null);
    setIsReviewFormOpen(true);
  };

  const handleEditReview = (review: Review) => {
    setReviewNotice('');
    setReviewComment(review.comment);
    setReviewRating(review.rating);
    setEditingReviewId(review.id);
    setIsReviewFormOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await reviewApi.delete(reviewId);
      setReviews(reviews.filter(review => review.id !== reviewId));
      resetReviewForm();
      setReviewNotice(t('serviceDetail.reviewDeleted'));
    } catch {
      setReviewNotice(t('serviceDetail.reviewDeleteError'));
    }
  };

  const handleSubmitReview = async () => {
    if (!service) return;

    if (!user) {
      setReviewNotice(t('serviceDetail.loginBeforeReview'));
      return;
    }

    if (user.role !== 'customer') {
      setReviewNotice(t('serviceDetail.customerOnlyReview'));
      return;
    }

    if (!reviewComment.trim()) {
      setReviewNotice(t('serviceDetail.writeReviewFirst'));
      return;
    }

    const reviewIdToUpdate = editingReviewId ?? userReview?.id;

    try {
      if (reviewIdToUpdate) {
        const { data } = await reviewApi.update(reviewIdToUpdate, {
          rating: reviewRating,
          comment: reviewComment.trim(),
        });
        resetReviewForm();
        if (data.status === 'visible') {
          const nextReview = mapReview(data);
          setReviews(reviews.map(review => review.id === reviewIdToUpdate ? nextReview : review));
          setReviewNotice(t('serviceDetail.reviewUpdated'));
        } else {
          setReviews(reviews.filter(review => review.id !== reviewIdToUpdate));
          setReviewNotice('Review update sent for admin approval. It will appear after moderation.');
        }
        return;
      }

      const { data } = await reviewApi.createForService(service.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      resetReviewForm();
      if (data.status === 'visible') {
        setReviews([mapReview(data), ...reviews]);
      }
      setReviewNotice('Review sent for admin approval. It will appear after moderation.');
    } catch (err: unknown) {
      setReviewNotice(getApiErrorMessage(err) || t('serviceDetail.reviewSaveError'));
    }
  };

  const handleBookService = async () => {
    if (!service) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (user.role !== 'customer') {
      setBookingNotice('Only customer accounts can book services.');
      return;
    }

    if (!bookingTime) {
      setBookingNotice('Choose a date and time for your booking.');
      return;
    }

    setBookingNotice('');
    setIsBooking(true);
    try {
      await bookingApi.create({
        providerServiceId: service.id,
        scheduledTime: new Date(bookingTime).toISOString(),
      });
      setBookingNotice('Booking request sent. The provider can now accept or decline it.');
      router.push(`/${country}/dashboard`);
    } catch (err: unknown) {
      setBookingNotice(getApiErrorMessage(err) || 'Could not create this booking.');
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="container mx-auto max-w-6xl px-4 py-10 md:py-14">
          <ServiceDetailSkeleton />
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
            <p className="text-lg font-bold">{t('serviceDetail.notFound')}</p>
            <p className="mt-2 text-sm text-slate-500">{error || t('serviceDetail.noServiceMatched')}</p>
            <Link href={`/${country}/services`} className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">
              {t('serviceDetail.browseServices')}
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
                  <Star className="h-3.5 w-3.5 fill-amber-500" /> {averageRating} ({reviews.length} {t('serviceDetail.reviews')})
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">{service.title}</h1>
              <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">{service.description || t('serviceDetail.noDescription')}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-500">{t('serviceDetail.price')}</p>
                  <p className="mt-2 text-lg font-black text-indigo-600 dark:text-indigo-400">{formatServicePrice(service.basePrice, service.priceType, countryCode)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-500">{t('serviceDetail.duration')}</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-black"><Clock className="h-4 w-4 text-indigo-500" /> {formatDuration(service.durationMins)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-500">{t('serviceDetail.location')}</p>
                  <p className="mt-2 flex items-center gap-2 text-lg font-black"><MapPin className="h-4 w-4 text-indigo-500" /> {service.location || t('serviceDetail.flexible')}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase text-slate-500">{t('serviceDetail.provider')}</p>
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
                  <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">{t('serviceDetail.viewProviderProfile')}</p>
                </div>
              </Link>

              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                <Shield className="h-4 w-4" />
                {t('serviceDetail.reviewNotice')}
              </div>

              <label className="mt-5 block">
                <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Preferred time
                </span>
                <input
                  type="datetime-local"
                  value={bookingTime}
                  min={toDateTimeLocalValue(new Date())}
                  onChange={event => setBookingTime(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>

              <button type="button" onClick={handleBookService} disabled={isBooking} className="mt-4 block w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isBooking ? 'Sending request...' : t('serviceDetail.bookThisService')}
              </button>

              {bookingNotice && (
                <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{bookingNotice}</p>
              )}
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold">{t('serviceDetail.serviceReviews')}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('serviceDetail.reviewsHelp')}</p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-3xl font-black">{averageRating}</p>
              <p className="text-sm text-slate-500">{reviews.length} {t('serviceDetail.totalReviews')}</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
                {reviews.map(review => (
                <div key={review.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{review.customer}</p>
                      <p className="text-xs text-slate-500">{review.date}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                        <Star className="h-4 w-4 fill-amber-500" />
                        {review.rating}
                      </div>
                      {canManageReview(review) && (
                        <div className="flex gap-2 text-xs font-bold">
                          <button type="button" onClick={() => handleEditReview(review)} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                            {t('common.edit')}
                          </button>
                          <button type="button" onClick={() => handleDeleteReview(review.id)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                            {t('common.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                </div>
              ))}
            </div>

            <div className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold">{editingReviewId ? t('serviceDetail.editReview') : t('serviceDetail.leaveReview')}</h3>
                {!isReviewFormOpen && !userReview && (
                  <button type="button" onClick={handleAddReview} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900">
                    {t('serviceDetail.addReview')}
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Login as a customer to review. Every new review is checked by admin before it becomes public.
              </p>
              {isReviewFormOpen && (
                <>
                  <div className="mb-4 mt-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button key={rating} onClick={() => setReviewRating(rating)} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20" aria-label={`${rating} ${t('serviceDetail.starRating')}`}>
                        <Star className={`h-5 w-5 ${rating <= reviewRating ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={event => setReviewComment(event.target.value)}
                    rows={4}
                    placeholder={t('serviceDetail.reviewPlaceholder')}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <div className="mt-4 flex gap-3">
                    <button onClick={handleSubmitReview} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-slate-900">
                      <CheckCircle className="h-4 w-4" />
                      {editingReviewId ? t('serviceDetail.updateReview') : t('serviceDetail.submitReview')}
                    </button>
                    <button type="button" onClick={resetReviewForm} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                      {t('common.cancel')}
                    </button>
                  </div>
                </>
              )}
              {reviewNotice && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{reviewNotice}</p>}
            </div>
          </div>
        </section>
      </main>

      <AuthRequiredModal
        country={country}
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => router.push(`/${country}/dashboard`)}
        title={t('serviceDetail.loginToBook')}
        message={t('serviceDetail.loginToBookMessage')}
      />
      <Footer />
    </div>
  );
}
