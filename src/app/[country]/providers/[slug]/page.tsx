"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { AlertCircle, CheckCircle, ChevronDown, Clock, Mail, MapPin, MessageSquare, Send, Shield, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { publicServiceApi, reviewApi, PublicProviderDto, PublicServiceDto, ReviewDto } from '@/lib/api';
import { formatServicePrice } from '@/lib/countries';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Provider';

type Review = {
  id: string;
  customer: string;
  customerEmail?: string;
  rating: number;
  comment: string;
  date: string;
  timestamp: number;
  status: ReviewDto['status'];
  isMine?: boolean;
};

type ReviewSort = 'relevant' | 'newest' | 'highest' | 'lowest';

const formatReviewDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const interpolate = (template: string, values: Record<string, string | number>) => {
  return Object.entries(values).reduce(
    (next, [key, value]) => next.replaceAll(`{${key}}`, String(value)),
    template
  );
};

const mapReview = (review: ReviewDto): Review => {
  return {
    id: review.id,
    customer: review.customerName,
    customerEmail: review.customerEmail,
    rating: review.rating,
    comment: review.comment,
    date: formatReviewDate(review.updatedAt || review.createdAt),
    timestamp: new Date(review.updatedAt || review.createdAt).getTime(),
    status: review.status,
    isMine: review.isMine,
  };
};

const REVIEWS_PER_PAGE = 5;

const getApiErrorMessage = (err: unknown) => {
  if (typeof err === 'object' && err && 'response' in err) {
    const response = (err as { response?: { data?: { error?: unknown } } }).response;
    if (typeof response?.data?.error === 'string') return response.data.error;
  }
  return null;
};

function ProviderProfileSkeleton() {
  return (
    <>
      <Skeleton className="h-64 w-full rounded-none bg-slate-800 md:h-80" />
      <div className="container relative z-10 mx-auto -mt-24 max-w-5xl px-4 pb-20">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:p-10">
          <div className="mb-8 flex flex-col gap-6 border-b border-slate-100 pb-8 dark:border-slate-800 md:flex-row md:items-center md:gap-10">
            <Skeleton className="h-32 w-32 shrink-0 rounded-full border-4 border-white dark:border-slate-900 md:h-40 md:w-40" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-5 w-full max-w-xl" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-44 rounded-full" />
                <Skeleton className="h-10 w-40 rounded-full" />
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-36">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <Skeleton className="mb-6 h-8 w-48" />
              <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                    <Skeleton className="mb-4 h-12 w-12 rounded-xl" />
                    <Skeleton className="mb-3 h-6 w-4/5" />
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="mb-6 h-4 w-2/3" />
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 dark:border-slate-800">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="space-y-6">
              <Skeleton className="h-56 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProviderProfilePage() {
  const params = useParams<{ country?: string; slug?: string }>();
  const country = params.country || 'lk';
  const slug = params.slug || '';
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { getConversation, sendMessage } = useMessages();
  const [provider, setProvider] = useState<PublicProviderDto | null>(null);
  const [isProviderLoading, setIsProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [messageError, setMessageError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewRatingFilter, setReviewRatingFilter] = useState('all');
  const [reviewSort, setReviewSort] = useState<ReviewSort>('relevant');
  const [reviewPage, setReviewPage] = useState(1);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const messageBoxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProvider = async () => {
      setIsProviderLoading(true);
      setProviderError('');
      try {
        const { data } = await publicServiceApi.getProvider(slug);
        if (cancelled) return;

        setProvider(data);
        setMessageText(interpolate(t('providerProfile.defaultMessage'), { name: data.name }));
        const { data: apiReviews } = await reviewApi.listProvider(data.userId);
        if (!cancelled) {
          setReviews(apiReviews.map(mapReview));
        }
      } catch {
        if (!cancelled) {
          setProviderError(t('providerProfile.loadError'));
        }
      } finally {
        if (!cancelled) {
          setIsProviderLoading(false);
        }
      }
    };

    if (slug) {
      loadProvider();
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;

    const loadMyReview = async () => {
      if (!provider || user?.role !== 'customer') {
        setMyReview(null);
        return;
      }

      try {
        const { data } = await reviewApi.getMine({ providerId: provider.userId });
        if (!cancelled) {
          setMyReview(data ? mapReview(data) : null);
        }
      } catch (err: unknown) {
        const status = typeof err === 'object' && err && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        if (!cancelled && status === 404) {
          setMyReview(null);
        }
      }
    };

    loadMyReview();

    return () => {
      cancelled = true;
    };
  }, [provider, user?.id, user?.role]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const nextReviews = reviewRatingFilter === 'all'
      ? [...reviews]
      : reviews.filter(review => review.rating === Number(reviewRatingFilter));

    return nextReviews.sort((a, b) => {
      if (reviewSort === 'highest') return b.rating - a.rating || b.timestamp - a.timestamp;
      if (reviewSort === 'lowest') return a.rating - b.rating || b.timestamp - a.timestamp;
      if (reviewSort === 'newest') return b.timestamp - a.timestamp;
      return b.rating - a.rating || b.timestamp - a.timestamp;
    });
  }, [reviewRatingFilter, reviewSort, reviews]);

  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));
  const paginatedReviews = filteredReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE);

  useEffect(() => {
    setReviewPage(1);
  }, [reviewRatingFilter, reviewSort]);

  useEffect(() => {
    setReviewPage(page => Math.min(page, totalReviewPages));
  }, [totalReviewPages]);

  const canManageReview = (review: Review) => Boolean(
    review.isMine || (user?.email && (review.customerEmail === user.email || (!review.customerEmail && review.customer === user.name)))
  );

  const userReview = myReview ?? reviews.find(canManageReview);

  const reviewPanelTitle = editingReviewId
    ? t('serviceDetail.editReview')
    : userReview
      ? t('providerProfile.yourReview')
      : t('serviceDetail.leaveReview');

  const reviewPanelMessage = !user
    ? t('serviceDetail.reviewPanel.loginProvider')
    : user.role !== 'customer'
      ? t('serviceDetail.reviewPanel.customerOnlyProvider')
      : userReview?.status === 'pending'
        ? t('serviceDetail.reviewPanel.pending')
        : userReview?.status === 'hidden'
          ? t('serviceDetail.reviewPanel.hidden')
          : userReview
            ? t('serviceDetail.reviewPanel.alreadyReviewedProvider')
            : t('serviceDetail.reviewPanel.shareProvider');

  const providerMessagesHref = provider
    ? `/${country}/messages?providerId=${encodeURIComponent(provider.userId)}&providerEmail=${encodeURIComponent(provider.email)}&focus=composer`
    : `/${country}/messages`;

  const providerConversation = provider && user
    ? getConversation(user.email, provider.email)
    : undefined;

  const hasSentMessageToProvider = Boolean(
    provider &&
    user &&
    (
      messageStatus === 'sent' ||
      providerConversation?.messages.some(message =>
        message.from === user.email &&
        (message.toUserId === provider.userId || message.to === provider.email)
      )
    )
  );

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
      if (myReview?.id === reviewId) {
        setMyReview(null);
      }
      resetReviewForm();
      setReviewNotice(t('serviceDetail.reviewDeleted'));
    } catch {
      setReviewNotice(t('serviceDetail.reviewDeleteError'));
    }
  };

  const handleSendMessage = async () => {
    if (messageStatus === 'sending') return;
    if (!provider) return;

    if (!user) {
      setMessageStatus('error');
      setMessageError(t('providerProfile.loginBeforeMessage'));
      return;
    }

    if (user.role !== 'customer') {
      setMessageStatus('error');
      setMessageError(t('providerProfile.customerOnlyMessage'));
      return;
    }

    if (!messageText.trim()) return;

    setMessageStatus('sending');
    setMessageError('');
    try {
      await sendMessage(user.email, user.name, provider.email, messageText.trim(), provider.userId);
      setMessageStatus('sent');
      setMessageText('');
      router.push(providerMessagesHref);
    } catch {
      setMessageStatus('error');
      setMessageError(interpolate(t('providerProfile.messageSendError'), { email: provider.email }));
    }
  };

  const handleSubmitReview = async () => {
    if (!provider) return;

    if (!user) {
      setReviewNotice(t('serviceDetail.loginBeforeReview'));
      return;
    }

    if (user.role !== 'customer') {
      setReviewNotice(t('serviceDetail.reviewPanel.customerOnlyProvider'));
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
        const nextReview = mapReview(data);
        resetReviewForm();
        setMyReview(nextReview);
        if (data.status === 'visible') {
          setReviews(reviews.some(review => review.id === reviewIdToUpdate)
            ? reviews.map(review => review.id === reviewIdToUpdate ? nextReview : review)
            : [nextReview, ...reviews]);
          setReviewNotice(t('serviceDetail.reviewUpdated'));
        } else {
          setReviews(reviews.filter(review => review.id !== reviewIdToUpdate));
          setReviewNotice(t('providerProfile.reviewUpdateModeration'));
        }
        return;
      }

      const { data } = await reviewApi.createForProvider(provider.userId, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      const nextReview = mapReview(data);
      resetReviewForm();
      setMyReview(nextReview);
      if (data.status === 'visible') {
        setReviews([nextReview, ...reviews]);
      }
      setReviewNotice(t('providerProfile.reviewSentModeration'));
    } catch (err: unknown) {
      setReviewNotice(getApiErrorMessage(err) || t('serviceDetail.reviewSaveError'));
    }
  };

  const formatPrice = (service: PublicServiceDto) => {
    return formatServicePrice(service.basePrice, service.priceType, country);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return t('serviceDetail.flexible');
    if (minutes < 60) return `${minutes} ${t('serviceDetail.minutesShort')}`;
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} ${t('serviceDetail.hoursShort')}`;
  };

  if (isProviderLoading) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <ProviderProfileSkeleton />
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main className="container mx-auto px-4 max-w-5xl py-20">
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm shadow-slate-200/60 dark:border-red-900 dark:bg-slate-900 dark:shadow-none">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-lg">{t('providerProfile.notFound')}</p>
            <p className="text-sm text-slate-500 mt-2">{providerError || t('providerProfile.noProviderMatched')}</p>
            <Link href={`/${country}/services`} className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
              {t('serviceDetail.browseServices')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] font-sans text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <div className="relative h-52 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 sm:h-64 md:h-72">
        {provider.coverImage ? (
          <Image src={provider.coverImage} alt={t('providerProfile.coverAlt')} width={1400} height={420} className="h-full w-full object-cover opacity-80" unoptimized priority />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#f7f8fb] via-[#f7f8fb]/30 to-transparent dark:from-slate-950 dark:via-slate-950/40" />
      </div>

      <div className="container relative z-10 mx-auto -mt-20 max-w-6xl px-4 pb-16 sm:-mt-24">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:p-8">
          <div className="mb-8 flex flex-col gap-6 border-b border-slate-100 pb-8 dark:border-slate-800 md:flex-row md:items-center md:gap-8">
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg dark:border-slate-900 md:h-40 md:w-40">
              <Image src={provider.profileImage || FALLBACK_AVATAR} alt={provider.name} width={160} height={160} className="h-full w-full object-cover" unoptimized />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="min-w-0 text-3xl font-black tracking-normal md:text-5xl">{provider.name}</h1>
                <CheckCircle className="h-6 w-6 shrink-0 text-blue-500 fill-blue-500/20" />
              </div>
              <p className="mb-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">{provider.description}</p>

              <div className="flex flex-wrap gap-3 text-sm font-bold">
                <div className="flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50 px-4 py-2 text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-amber-500" /> {averageRating} ({reviews.length} {t('serviceDetail.reviews')})
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <MapPin className="h-4 w-4" /> {provider.location || t('providerProfile.serviceAreaNotSet')}
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-green-200/70 bg-green-50 px-4 py-2 text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-400">
                  <Shield className="h-4 w-4" /> {t('providerProfile.verifiedBackground')}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto">
              {hasSentMessageToProvider && (
                <Link
                  href={providerMessagesHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-8 py-3.5 font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 md:w-auto"
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('providerProfile.message')}
                </Link>
              )}
            </div>
          </div>

          <div className={`grid gap-8 ${hasSentMessageToProvider ? '' : 'lg:grid-cols-[1fr_320px]'}`}>
            <div>
              <h2 className="mb-5 text-2xl font-black">{t('providerProfile.availableServices')}</h2>
              <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                {provider.services.map(service => (
                  <Link key={service.id} href={`/${country}/services/${service.id}`} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:hover:shadow-none">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <CheckCircle className="h-6 w-6 text-slate-500" />
                      </div>
                      <h3 className="mb-2 line-clamp-2 text-xl font-black transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-200">{service.title}</h3>
                      <p className="mb-6 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{service.description}</p>

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4 dark:border-slate-800">
                      <span className="min-w-0 truncate text-lg font-black text-slate-950 dark:text-white">{formatPrice(service)}</span>
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Clock className="h-3 w-3" /> {formatDuration(service.durationMins)}
                      </span>
                    </div>
                  </Link>
                ))}
                {provider.services.length === 0 && (
                  <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
                    {t('providerProfile.noActiveServices')}
                  </div>
                )}
              </div>
            </div>

            {!hasSentMessageToProvider && (
            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/50">
                <div className="mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-slate-500" />
                  <h2 className="font-bold text-lg">{t('providerProfile.messageProvider')}</h2>
                </div>
                <textarea
                  ref={messageBoxRef}
                  value={messageText}
                  onChange={event => setMessageText(event.target.value)}
                  rows={5}
                  placeholder={t('providerProfile.messagePlaceholder')}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800/70"
                />
                {messageStatus === 'sent' && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                    {t('providerProfile.messageSent')} <Link href={providerMessagesHref} className="font-bold underline">{t('messages.title')}</Link>.
                  </div>
                )}
                {messageStatus === 'error' && (
                  <div className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{messageError}</span>
                  </div>
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={messageStatus === 'sending' || !messageText.trim()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  <Send className="w-4 h-4" />
                  {messageStatus === 'sending' ? t('providerProfile.sendingMessage') : t('providerProfile.sendMessage')}
                </button>
              </div>
            </aside>
            )}
          </div>

          <section className="mt-10 border-t border-slate-100 pt-8 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t('providerProfile.customerReviews')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('providerProfile.reviewsHelp')}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{averageRating}</p>
                <p className="text-sm text-slate-500">{reviews.length} {t('serviceDetail.totalReviews')}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              <div className="space-y-4">
                {reviews.length > 0 && (
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-3">
                      <label className="relative">
                        <span className="sr-only">{t('providerProfile.sortReviews')}</span>
                        <select
                          value={reviewSort}
                          onChange={event => setReviewSort(event.target.value as ReviewSort)}
                          className="h-11 appearance-none rounded-full border border-slate-200 bg-white py-0 pl-5 pr-11 text-sm font-bold text-slate-700 outline-none transition-colors hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <option value="relevant">{t('providerProfile.sortMostRelevant')}</option>
                          <option value="newest">{t('providerProfile.sortNewest')}</option>
                          <option value="highest">{t('providerProfile.sortHighest')}</option>
                          <option value="lowest">{t('providerProfile.sortLowest')}</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </label>
                      <label className="relative">
                        <span className="sr-only">{t('providerProfile.filterReviews')}</span>
                        <select
                          value={reviewRatingFilter}
                          onChange={event => setReviewRatingFilter(event.target.value)}
                          className="h-11 appearance-none rounded-full border border-slate-200 bg-white py-0 pl-5 pr-11 text-sm font-bold text-slate-700 outline-none transition-colors hover:border-indigo-200 focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          <option value="all">{t('providerProfile.allRatings')}</option>
                          {[5, 4, 3, 2, 1].map(rating => (
                            <option key={rating} value={rating}>{interpolate(t('providerProfile.starOption'), { rating })}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      </label>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {interpolate(t('providerProfile.shownCount'), { count: filteredReviews.length })}
                    </p>
                  </div>
                )}
                {paginatedReviews.map(review => (
                  <div key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold">{review.customer}</p>
                        <p className="text-xs text-slate-500">{review.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm">
                          <Star className="w-4 h-4 fill-amber-500" />
                          {review.rating}
                        </div>
                        {canManageReview(review) && (
                          <div className="flex gap-2 text-xs font-bold">
                            <button type="button" onClick={() => handleEditReview(review)} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer">
                              {t('common.edit')}
                            </button>
                            <button type="button" onClick={() => handleDeleteReview(review.id)} className="text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer">
                              {t('common.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                  </div>
                ))}
                {reviews.length > 0 && filteredReviews.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {t('providerProfile.noReviewsMatch')}
                  </div>
                )}
                {filteredReviews.length > REVIEWS_PER_PAGE && (
                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {interpolate(t('providerProfile.pageCount'), { page: reviewPage, total: totalReviewPages })}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewPage(page => Math.max(1, page - 1))}
                        disabled={reviewPage === 1}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {t('providerProfile.previous')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewPage(page => Math.min(totalReviewPages, page + 1))}
                        disabled={reviewPage === totalReviewPages}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {t('providerProfile.next')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {(!userReview || isReviewFormOpen) && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 h-fit">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-lg">{reviewPanelTitle}</h3>
                  {!isReviewFormOpen && !userReview && (
                    <button type="button" onClick={handleAddReview} className="rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-sm font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
                      {t('serviceDetail.addReview')}
                    </button>
                  )}
                  {!isReviewFormOpen && userReview && (
                    <button type="button" onClick={() => handleEditReview(userReview)} className="rounded-xl bg-slate-900 dark:bg-white px-4 py-2 text-sm font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
                      {t('common.edit')}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {reviewPanelMessage}
                </p>
                {isReviewFormOpen && (
                  <>
                    <div className="flex gap-1 mb-4 mt-4">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          onClick={() => setReviewRating(rating)}
                          className="w-9 h-9 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center transition-colors"
                          aria-label={interpolate(t('providerProfile.starRatingLabel'), { rating })}
                        >
                          <Star className={`w-5 h-5 ${rating <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={event => setReviewComment(event.target.value)}
                      rows={4}
                      placeholder={t('providerProfile.reviewPlaceholder')}
                      className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={handleSubmitReview}
                        className="flex-1 rounded-xl bg-slate-900 dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                      >
                        {editingReviewId ? t('serviceDetail.updateReview') : t('serviceDetail.submitReview')}
                      </button>
                      <button type="button" onClick={resetReviewForm} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                        {t('common.cancel')}
                      </button>
                    </div>
                  </>
                )}
                {reviewNotice && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{reviewNotice}</p>
                )}
              </div>
              )}
            </div>
          </section>
        </div>
      </div>
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
