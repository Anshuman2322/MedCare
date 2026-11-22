import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Stars from './Stars.jsx';
import ReviewModal from './ReviewModal.jsx';
import ReviewCard from './ReviewCard.jsx';
import { fetchReviews } from '../../api/reviews';
import { fromSiteReview } from './combined.js';

const PAGE_SIZE = 5;
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
];

function Distribution({ summary, active, onPick }) {
  return (
    <ul className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = summary.distribution?.[stars] || 0;
        const pct = summary.count ? Math.round((count / summary.count) * 100) : 0;
        const selected = active === stars;
        return (
          <li key={stars}>
            <button
              type="button"
              disabled={!count}
              aria-pressed={selected}
              onClick={() => onPick(selected ? null : stars)}
              className={`group flex w-full items-center gap-3 rounded-lg px-2 py-1 text-sm transition disabled:cursor-default ${
                selected ? 'bg-amber-50 ring-1 ring-amber-200' : 'enabled:hover:bg-slate-50'
              }`}
            >
              <span className="w-12 shrink-0 text-left font-medium text-slate-600">{stars} star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <span className="block h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-slate-500">{pct}%</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// Product reviews for search engines; only output when there is at least one review.
function ReviewSchema({ medicine, summary, reviews }) {
  if (!summary.count) return null;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: medicine.name,
    ...(medicine.image ? { image: medicine.image } : {}),
    ...(medicine.brand ? { brand: { '@type': 'Brand', name: medicine.brand } } : {}),
    aggregateRating: { '@type': 'AggregateRating', ratingValue: summary.average, reviewCount: summary.count, bestRating: 5, worstRating: 1 },
    review: reviews.slice(0, 5).map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      datePublished: String(r.createdAt).slice(0, 10),
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      ...(r.title ? { name: r.title } : {}),
      reviewBody: r.body,
    })),
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

/**
 * Reviews section: summary, filters, list and the review form. With `medicine`
 * it covers that product; without it, every public review (the /reviews page),
 * each linked to its product.
 */
export default function ProductReviews({ medicine = null }) {
  const product = medicine ? medicine.slug || medicine._id : undefined;
  const [state, setState] = useState({ status: 'loading', summary: null, reviews: [], page: 1, pages: 1, total: 0 });
  const [sort, setSort] = useState('newest');
  const [rating, setRating] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [writing, setWriting] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, status: prev.summary ? 'refreshing' : 'loading' }));
    fetchReviews({ product, sort, rating, page: 1, limit: PAGE_SIZE })
      .then((data) => active && setState({ status: 'ready', ...data }))
      .catch(() => active && setState((prev) => ({ ...prev, status: 'error' })));
    return () => {
      active = false;
    };
  }, [product, sort, rating, version]);

  // A new review is live at once: show the newest-first list so it sits on top.
  const onSubmitted = useCallback(() => {
    setSort('newest');
    setRating(null);
    setVersion((v) => v + 1);
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const data = await fetchReviews({ product, sort, rating, page: state.page + 1, limit: PAGE_SIZE });
      setState((prev) => ({ ...prev, ...data, reviews: [...prev.reviews, ...data.reviews] }));
    } catch {
      // Keep what is shown; the button stays so the visitor can try again.
    } finally {
      setLoadingMore(false);
    }
  }, [product, sort, rating, state.page]);

  if (state.status === 'error' && !state.summary) return null;
  const summary = state.summary || { average: 0, count: 0, distribution: {} };
  const hasReviews = summary.count > 0;
  const writeButton = (
    <button
      type="button"
      onClick={() => setWriting(true)}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.8)] transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M13.6 3.2a2 2 0 012.8 2.8l-8.7 8.7-3.6.8.8-3.6z" />
      </svg>
      Write a review
    </button>
  );

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 scroll-mt-24 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      {medicine && <ReviewSchema medicine={medicine} summary={summary} reviews={state.reviews} />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight text-slate-900">
            {medicine ? 'Customer reviews' : 'All customer reviews'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {medicine ? 'Shared by customers who bought or asked about this product.' : 'Shared by our customers about our products and service.'}
          </p>
        </div>
      </div>

      {state.status === 'loading' ? (
        <div className="mt-8 grid animate-pulse gap-8 lg:grid-cols-[300px_1fr]" aria-busy="true" aria-label="Loading reviews">
          <div className="h-56 rounded-2xl bg-slate-100" />
          <div className="space-y-4">
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-24 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : !hasReviews ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
          <Stars value={0} size="lg" />
          <p className="mt-4 text-lg font-semibold text-slate-900">No reviews yet</p>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            {medicine ? `Bought ${medicine.name} from us? Be the first to share your experience.` : 'Bought from us? Be the first to share your experience.'}
          </p>
          <div className="mt-6 w-full max-w-xs">{writeButton}</div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 ring-1 ring-slate-100">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold leading-none tracking-tight text-slate-900">{summary.average.toFixed(1)}</span>
                <span className="pb-1 text-sm font-medium text-slate-500">out of 5</span>
              </div>
              <Stars value={summary.average} size="lg" className="mt-3" />
              <p className="mt-2 text-sm text-slate-600">
                Based on {summary.count} review{summary.count === 1 ? '' : 's'}
              </p>
              <div className="mt-5">
                <Distribution summary={summary} active={rating} onPick={setRating} />
              </div>
            </div>
            <div className="mt-4">{writeButton}</div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>
                  {state.total} review{state.total === 1 ? '' : 's'}
                </span>
                {rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                  >
                    {rating}-star only
                    <span aria-hidden="true">×</span>
                    <span className="sr-only">, clear filter</span>
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={`transition-opacity ${state.status === 'refreshing' ? 'opacity-50' : ''}`}>
              {state.reviews.length ? (
                state.reviews.map((review) => <ReviewCard key={review.id} review={fromSiteReview(review)} showProduct={!medicine} />)
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">No {rating}-star reviews yet.</p>
              )}
            </div>

            {state.page < state.pages && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Show more reviews'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ReviewModal
        open={writing}
        onClose={() => setWriting(false)}
        product={medicine ? { name: medicine.name, slug: product } : null}
        onSubmitted={onSubmitted}
      />
    </section>
  );
}
