import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollAnimation, animationClasses } from '../utils/animations.jsx';
import { BUSINESS } from '../config/business';
import useOverallRating from '../hooks/useOverallRating';
import StarRow from './reviews/Stars.jsx';
import ReviewModal from './reviews/ReviewModal.jsx';
import SourceBadge from './reviews/SourceBadge.jsx';
import { formatReviewDate, initials } from './reviews/format.js';
import { externalReviews, fromSiteReview } from './reviews/combined.js';

const { countries } = BUSINESS;
const MAX_CARDS = 6;
// Website reviews fill up to this many cards; other platforms fill the rest.
const MAX_SITE_CARDS = 4;

// Takes the shared review shape from reviews/combined.js.
function ReviewCard({ review }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 hover:shadow-[0_14px_32px_rgba(16,185,129,0.14)]">
      {/* Fixed height so stars and the quote mark line up across cards */}
      <div className="flex h-7 items-center justify-between gap-3">
        {review.rating != null ? (
          <StarRow value={review.rating} size="sm" />
        ) : (
          <svg className="h-7 w-7 text-emerald-200" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
            <path d="M9.3 25C6.4 25 4 22.6 4 19.4c0-5.3 3.7-10.2 9.3-12.4l1.2 2c-3.2 1.6-5 3.9-5.4 6.4 2.8 0 5 2.1 5 4.8 0 2.7-2.1 4.8-4.8 4.8zm14 0c-2.9 0-5.3-2.4-5.3-5.6 0-5.3 3.7-10.2 9.3-12.4l1.2 2c-3.2 1.6-5 3.9-5.4 6.4 2.8 0 5 2.1 5 4.8 0 2.7-2.1 4.8-4.8 4.8z" />
          </svg>
        )}
        <SourceBadge source={review.source} verifiedBuyer={review.verifiedBuyer} />
      </div>
      {review.title && <div className="mt-3 font-semibold text-slate-900">{review.title}</div>}
      <blockquote className={`${review.title ? 'mt-1' : 'mt-3'} flex-1 text-[15px] leading-7 text-slate-700 line-clamp-6`}>{review.body}</blockquote>
      <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100" aria-hidden="true">
          {initials(review.author)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900">{review.author}</span>
          <span className="block text-xs text-slate-500">
            {[review.place, formatReviewDate(review.date, { month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}
          </span>
        </span>
        {review.product &&
          (review.product.slug ? (
            <Link
              to={`/medicine/${review.product.slug}`}
              className="ml-auto hidden max-w-[45%] shrink-0 truncate rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100 hover:text-emerald-700 hover:ring-emerald-200 sm:inline"
            >
              {review.product.name}
            </Link>
          ) : (
            <span className="ml-auto hidden shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-100 sm:inline">
              {review.product.name}
            </span>
          ))}
      </figcaption>
    </figure>
  );
}

// Buyer reviews: the latest live reviews from this site (pinned ones first),
// topped up with reviews from other platforms, beside one overall rating that
// combines every platform.
export default function Testimonials() {
  const [headerRef, headerVisible] = useScrollAnimation(0.1);
  const [gridRef, gridVisible] = useScrollAnimation(0.05);
  const [writing, setWriting] = useState(false);
  const [version, setVersion] = useState(0);
  const { average, platforms, siteReviews } = useOverallRating(version);

  const cards = [...siteReviews.slice(0, MAX_SITE_CARDS).map(fromSiteReview), ...externalReviews()].slice(0, MAX_CARDS);

  return (
    <section className="w-full bg-white" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-10 xl:px-12">
        <div ref={headerRef} className={`mx-auto max-w-2xl text-center ${animationClasses.fadeUp(headerVisible)}`}>
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
            Buyer reviews
          </div>
          <h2 id="testimonials-title" className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What our buyers say
          </h2>
          <p className="mt-3 text-gray-600">Real reviews from our buyers, wherever they shop with us.</p>
          <button
            type="button"
            onClick={() => setWriting(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M13.6 3.2a2 2 0 012.8 2.8l-8.7 8.7-3.6.8.8-3.6z" />
            </svg>
            Bought from us? Write a review
          </button>
        </div>

        <div ref={gridRef} className={`mt-10 grid items-start gap-5 lg:grid-cols-[minmax(0,360px)_1fr] ${animationClasses.fadeUp(gridVisible)}`}>
          <div className="flex flex-col rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-7 text-white shadow-[0_24px_48px_-20px_rgba(5,120,80,0.6)] lg:sticky lg:top-28">
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-emerald-100">Overall rating</div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-6xl font-extrabold leading-none tracking-tight">{average.toFixed(1)}</span>
              <span className="pb-1.5 text-lg font-semibold text-emerald-100">/ 5</span>
            </div>
            <StarRow value={average} size="lg" className="mt-3" onDark />
            <p className="mt-2 text-sm text-emerald-50">Average across all our review platforms</p>
            <ul className="mt-6 space-y-3 rounded-xl bg-white/95 p-4" aria-label="Rating on each platform">
              {platforms.map((p) => (
                <li key={p.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-700">{p.name}</span>
                  <span className="flex items-center gap-2">
                    <StarRow value={p.rating} size="xs" />
                    <span className="w-7 text-right font-bold tabular-nums text-slate-900">{p.rating.toFixed(1)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/reviews"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
            >
              Read all customer reviews
              <span aria-hidden="true">{'→'}</span>
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {cards.map((review, i) => (
              // An odd last card spans the full row instead of leaving a gap.
              <div key={review.id} className={cards.length % 2 && i === cards.length - 1 ? 'sm:col-span-2' : ''}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>

        {cards.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/reviews"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.8)] transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              See all customer reviews
              <span aria-hidden="true">{'→'}</span>
            </Link>
          </div>
        )}

        <div className="mt-10 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Buyers in {countries.length}+ countries</div>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {countries.map((country) => (
              <li key={country} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700">
                {country}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ReviewModal open={writing} onClose={() => setWriting(false)} onSubmitted={() => setVersion((v) => v + 1)} />
    </section>
  );
}
