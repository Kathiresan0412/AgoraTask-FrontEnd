"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Star, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal';
import { useAuth } from '@/contexts/AuthContext';
import { reviewApi, ReviewDto } from '@/lib/api';

type HomeReview = {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
};

const mapSystemReview = (review: ReviewDto): HomeReview => {
  return {
    id: review.id,
    name: review.customerName || 'AgoraTask customer',
    role: 'AgoraTask user',
    rating: review.rating,
    text: review.comment,
  };
};

function ReviewStars({ rating, onSelect }: { rating: number; onSelect?: (rating: number) => void }) {
  return (
    <div className="flex gap-1 text-amber-500" aria-label={`${rating} star review`}>
      {[1, 2, 3, 4, 5].map(star => {
        const selected = star <= rating;
        const Icon = (
          <Star className={`h-5 w-5 ${selected ? 'fill-amber-500 text-amber-500' : 'text-neutral-300 dark:text-neutral-700'}`} />
        );

        if (!onSelect) return <span key={star}>{Icon}</span>;

        return (
          <button
            key={star}
            type="button"
            onClick={() => onSelect(star)}
            className="rounded-md p-1 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/40"
            aria-label={`${star} star rating`}
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: HomeReview }) {
  return (
    <article className="mx-3 w-[18rem] shrink-0 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:w-[22rem]">
      <ReviewStars rating={review.rating} />
      <p className="mt-4 min-h-24 text-sm leading-6 text-neutral-700 dark:text-neutral-300">{review.text}</p>
      <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <p className="text-sm font-black text-neutral-950 dark:text-white">{review.name}</p>
        <p className="text-xs font-semibold text-neutral-500">{review.role}</p>
      </div>
    </article>
  );
}

export function HomeReviews() {
  const params = useParams<{ country?: string }>();
  const country = params.country || 'lk';
  const { user } = useAuth();
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [mySystemReview, setMySystemReview] = useState<ReviewDto | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState('');
  const [shouldScrollReviews, setShouldScrollReviews] = useState(false);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const reviewSetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadReviews = async () => {
      try {
        const { data } = await reviewApi.listSystem();
        if (mounted) setReviews(data.map(mapSystemReview));
      } catch {
        if (mounted) setNotice('Could not load AgoraTask reviews from the API.');
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    };

    loadReviews();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const marquee = marqueeRef.current;
    const reviewSet = reviewSetRef.current;
    if (!marquee || !reviewSet) return;

    const updateScrollState = () => {
      setShouldScrollReviews(reviewSet.scrollWidth > marquee.clientWidth);
    };

    updateScrollState();

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(marquee);
    observer.observe(reviewSet);

    return () => observer.disconnect();
  }, [reviews]);

  useEffect(() => {
    let mounted = true;

    const loadMySystemReview = async () => {
      if (!user) {
        setMySystemReview(null);
        return;
      }

      try {
        const { data } = await reviewApi.getMySystem();
        if (mounted) setMySystemReview(data ?? null);
      } catch {
        if (mounted) setMySystemReview(null);
      }
    };

    loadMySystemReview();

    return () => {
      mounted = false;
    };
  }, [user]);

  const openReviewFlow = () => {
    setNotice('');
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (mySystemReview) {
      setRating(mySystemReview.rating);
      setComment(mySystemReview.comment);
    }
    setReviewOpen(true);
  };

  const submitReview = async () => {
    const trimmed = comment.trim();
    if (!trimmed) {
      setNotice('Write a short comment before submitting your review.');
      return;
    }

    try {
      const { data } = mySystemReview
        ? await reviewApi.update(mySystemReview.id, { rating, comment: trimmed })
        : await reviewApi.createForSystem({ rating, comment: trimmed });
      setComment('');
      setRating(5);
      setMySystemReview(data);
      setNotice('Thanks. Your AgoraTask review was submitted for admin approval.');
      setReviewOpen(false);
    } catch {
      setNotice('Could not save your AgoraTask review to the API.');
    }
  };

  const deleteMySystemReview = async () => {
    if (!mySystemReview) return;

    try {
      await reviewApi.delete(mySystemReview.id);
      setMySystemReview(null);
      setComment('');
      setRating(5);
      setNotice('Your AgoraTask review was deleted.');
      setReviewOpen(false);
    } catch {
      setNotice('Could not delete your AgoraTask review.');
    }
  };

  return (
    <section id="reviews" className="overflow-hidden bg-white py-20 dark:bg-neutral-950">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-neutral-500">Customer comments</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 dark:text-white md:text-5xl">
              AgoraTask reviews from people booking real services.
            </h2>
          </div>
          <button
            type="button"
            onClick={openReviewFlow}
            className="inline-flex w-fit items-center justify-center rounded-lg bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            {mySystemReview ? 'Edit AgoraTask Review' : 'Review AgoraTask'}
          </button>
        </div>

        {loadingReviews ? (
          <div className="border-y border-neutral-200 py-12 text-sm font-semibold text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            Loading AgoraTask reviews...
          </div>
        ) : reviews.length > 0 ? (
          <div
            ref={marqueeRef}
            className={`border-y border-neutral-200 py-6 dark:border-neutral-800 ${shouldScrollReviews ? 'home-review-marquee' : 'home-review-marquee-static'}`}
          >
            <div className={shouldScrollReviews ? 'home-review-track' : 'home-review-track-static'}>
              <div ref={reviewSetRef} className="home-review-set">
                {reviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              {shouldScrollReviews && (
                <div className="home-review-set" aria-hidden="true">
                  {reviews.map(review => (
                    <ReviewCard key={`${review.id}-copy`} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-y border-neutral-200 py-12 text-sm font-semibold text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            No approved AgoraTask reviews yet.
          </div>
        )}

        {notice && <p className="mt-5 text-sm font-semibold text-neutral-500 dark:text-neutral-400">{notice}</p>}
      </div>

      <AuthRequiredModal
        country={country}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={() => setReviewOpen(true)}
        title="Login to review AgoraTask"
        message="Please log in before leaving a platform review."
      />

      {reviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="system-review-title">
          <button type="button" className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setReviewOpen(false)} aria-label="Close review form" />
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Close review form"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 id="system-review-title" className="text-2xl font-black text-slate-950 dark:text-white">Rate AgoraTask</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              {mySystemReview ? 'Update your platform review. Updates are sent for admin approval.' : 'Share your experience using the platform.'}
            </p>
            <div className="mt-6">
              <ReviewStars rating={rating} onSelect={setRating} />
            </div>
            <textarea
              value={comment}
              onChange={event => setComment(event.target.value)}
              rows={4}
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="What worked well for you?"
            />
            <button
              type="button"
              onClick={submitReview}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
            >
              {mySystemReview ? 'Update review' : 'Submit review'}
            </button>
            {mySystemReview && (
              <button
                type="button"
                onClick={deleteMySystemReview}
                className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/70 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                Delete review
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
