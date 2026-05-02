"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AlertCircle, CheckCircle, Clock, Mail, MapPin, MessageSquare, Send, Shield, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMessages } from '@/contexts/MessagesContext';
import { publicServiceApi, PublicProviderDto, PublicServiceDto } from '@/lib/api';

const FALLBACK_COVER_IMAGE = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=2000&auto=format&fit=crop';
const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Provider';

type Review = {
  id: string;
  customer: string;
  rating: number;
  comment: string;
  date: string;
};

const initialReviews: Review[] = [
  {
    id: '1',
    customer: 'Nimali Fernando',
    rating: 5,
    comment: 'Very punctual and the apartment felt spotless after the deep clean.',
    date: 'Apr 24, 2026',
  },
  {
    id: '2',
    customer: 'Kasun Perera',
    rating: 5,
    comment: 'Good communication before the booking and professional service on arrival.',
    date: 'Apr 12, 2026',
  },
  {
    id: '3',
    customer: 'Ayesha Silva',
    rating: 4,
    comment: 'Reliable team. I would book them again for office cleaning.',
    date: 'Mar 30, 2026',
  },
];

const loadSavedReviews = (providerEmail: string) => {
  if (typeof window === 'undefined') return initialReviews;

  const saved = window.localStorage.getItem(`agoratask_reviews_${providerEmail}`);
  if (!saved) return initialReviews;

  try {
    return JSON.parse(saved) as Review[];
  } catch {
    return initialReviews;
  }
};

export default function ProviderProfilePage() {
  const params = useParams<{ country?: string; slug?: string }>();
  const country = params.country || 'lk';
  const slug = params.slug || '';
  const { user } = useAuth();
  const { sendMessage } = useMessages();
  const [provider, setProvider] = useState<PublicProviderDto | null>(null);
  const [isProviderLoading, setIsProviderLoading] = useState(true);
  const [providerError, setProviderError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageStatus, setMessageStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [messageError, setMessageError] = useState('');
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');
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
        setMessageText(`Hi ${data.name}, I would like to ask about your services.`);
        setReviews(loadSavedReviews(data.email));
      } catch {
        if (!cancelled) {
          setProviderError('Could not load this provider from the API.');
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

  const averageRating = useMemo(() => {
    if (!reviews.length) return '0.0';
    return (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const focusMessage = () => {
    messageBoxRef.current?.focus();
    messageBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSendMessage = async () => {
    if (!provider) return;

    if (!user) {
      setMessageStatus('error');
      setMessageError('Please log in as a customer before messaging this provider.');
      return;
    }

    if (user.role !== 'customer') {
      setMessageStatus('error');
      setMessageError('Only customer accounts can start provider conversations from this page.');
      return;
    }

    if (!messageText.trim()) return;

    setMessageStatus('sending');
    setMessageError('');
    try {
      await sendMessage(user.email, user.name, provider.email, messageText.trim());
      setMessageStatus('sent');
      setMessageText('');
    } catch {
      setMessageStatus('error');
      setMessageError(`Could not send the message. Make sure ${provider.email} exists as a provider account.`);
    }
  };

  const handleSubmitReview = () => {
    if (!provider) return;

    if (!user) {
      setReviewNotice('Please log in as a customer before leaving a review.');
      return;
    }

    if (user.role !== 'customer') {
      setReviewNotice('Only customer accounts can review providers.');
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
    localStorage.setItem(`agoratask_reviews_${provider.email}`, JSON.stringify(nextReviews));
    setReviewComment('');
    setReviewRating(5);
    setReviewNotice('Review added on this device. Backend review storage still needs the API route.');
  };

  const formatPrice = (service: PublicServiceDto) => {
    if (!service.basePrice) return 'Quote';
    const suffix = service.priceType === 'hourly' ? ' / hr' : '';
    return `Rs. ${Number(service.basePrice).toLocaleString()}${suffix}`;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Flexible';
    if (minutes < 60) return `${minutes} mins`;
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
  };

  if (isProviderLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="container mx-auto px-4 max-w-5xl py-20">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
            <p className="font-bold text-lg">Loading provider...</p>
            <p className="text-sm text-slate-500 mt-2">Fetching the profile from the API.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
        <Navbar />
        <main className="container mx-auto px-4 max-w-5xl py-20">
          <div className="rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="font-bold text-lg">Provider not found</p>
            <p className="text-sm text-slate-500 mt-2">{providerError || 'No provider matched this URL.'}</p>
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

      <div className="w-full h-64 md:h-80 relative bg-slate-800">
        <img src={provider.coverImage || FALLBACK_COVER_IMAGE} alt="Provider cover" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-24 relative z-10 pb-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/60 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center border-b border-slate-100 dark:border-slate-800 pb-8 mb-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-slate-900 overflow-hidden bg-white shrink-0 shadow-lg -mt-16 md:-mt-20">
              <img src={provider.profileImage || FALLBACK_AVATAR} alt={provider.name} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{provider.name}</h1>
                <CheckCircle className="w-6 h-6 text-blue-500 fill-blue-500/20" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-4">{provider.description}</p>

              <div className="flex flex-wrap gap-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full border border-amber-200/50 dark:border-amber-800/50">
                  <Star className="w-4 h-4 fill-amber-500" /> {averageRating} ({reviews.length} reviews)
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                  <MapPin className="w-4 h-4" /> {provider.location || 'Service area not set'}
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-4 py-2 rounded-full border border-green-200/50 dark:border-green-800/50">
                  <Shield className="w-4 h-4" /> Verified Background
                </div>
              </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-3">
              <Link href={`/${country}/dashboard`} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 active:scale-95 text-center block">
                Book Now
              </Link>
              <button onClick={focusMessage} className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95">
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Available Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {provider.services.map(service => (
                  <div key={service.id} className="group border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-900 transition-all flex flex-col h-full">
                    <div className="mb-4 bg-white dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                      <CheckCircle className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-xl mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{service.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{service.description}</p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/60 dark:border-slate-800">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-lg">{formatPrice(service)}</span>
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDuration(service.durationMins)}
                      </span>
                    </div>
                  </div>
                ))}
                {provider.services.length === 0 && (
                  <div className="md:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
                    This provider has not published active services yet.
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  <h2 className="font-bold text-lg">Message Provider</h2>
                </div>
                <textarea
                  ref={messageBoxRef}
                  value={messageText}
                  onChange={event => setMessageText(event.target.value)}
                  rows={5}
                  placeholder="Ask about availability, price, or service details"
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {messageStatus === 'sent' && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                    Message sent. Continue in <Link href={`/${country}/messages`} className="font-bold underline">Messages</Link>.
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
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {messageStatus === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </aside>
          </div>

          <section className="mt-10 border-t border-slate-100 dark:border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Read customer feedback and leave your own review.</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{averageRating}</p>
                <p className="text-sm text-slate-500">{reviews.length} total reviews</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold">{review.customer}</p>
                        <p className="text-xs text-slate-500">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-sm">
                        <Star className="w-4 h-4 fill-amber-500" />
                        {review.rating}
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 h-fit">
                <h3 className="font-bold text-lg mb-4">Leave a Review</h3>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className="w-9 h-9 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center justify-center transition-colors"
                      aria-label={`${rating} star rating`}
                    >
                      <Star className={`w-5 h-5 ${rating <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={event => setReviewComment(event.target.value)}
                  rows={4}
                  placeholder="Share how the service went"
                  className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {reviewNotice && (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{reviewNotice}</p>
                )}
                <button
                  onClick={handleSubmitReview}
                  className="mt-4 w-full rounded-xl bg-slate-900 dark:bg-white px-4 py-3 text-sm font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
