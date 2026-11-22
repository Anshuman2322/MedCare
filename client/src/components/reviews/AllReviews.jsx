import React, { useEffect, useMemo, useState } from 'react';
import Stars from './Stars.jsx';
import ReviewCard from './ReviewCard.jsx';
import ReviewModal from './ReviewModal.jsx';
import { fetchReviews } from '../../api/reviews';
import { SITE_SOURCE, combinedRating, externalReviews, fromSiteReview, sortReviews, sourceName } from './combined.js';

const PAGE_SIZE = 8;
const SITE_PAGE = 20;
const MAX_SITE_PAGES = 10;
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
];

async function loadAllSiteReviews() {
  const first = await fetchReviews({ page: 1, limit: SITE_PAGE });
  const reviews = [...first.reviews];
  for (let page = 2; page <= Math.min(first.pages, MAX_SITE_PAGES); page += 1) {
    const next = await fetchReviews({ page, limit: SITE_PAGE });
    reviews.push(...next.reviews);
  }
  return { reviews, summary: first.summary };
}

/**
 * Every review in one list, from this website and from other platforms
 * (IndiaMART today), each with a badge saying where it came from, and one
 * overall rating that combines them.
 */
export default function AllReviews() {
  const [site, setSite] = useState({ status: 'loading', reviews: [], summary: null });
  const [source, setSource] = useState('all');
  const [sort, setSort] = useState('newest');
  const [shown, setShown] = useState(PAGE_SIZE);
  const [writing, setWriting] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadAllSiteReviews()
      .then((data) => active && setSite({ status: 'ready', ...data }))
      // Other platforms' reviews still show if this site's can't be loaded.
      .catch(() => active && setSite((prev) => ({ ...prev, status: 'error' })));
    return () => {
      active = false;
    };
  }, [version]);

  const all = useMemo(() => [...site.reviews.map(fromSiteReview), ...externalReviews()], [site.reviews]);
  const sources = useMemo(() => {
    const keys = [...new Set(all.map((r) => r.source))];
    return keys.sort((a, b) => (a === SITE_SOURCE ? -1 : b === SITE_SOURCE ? 1 : sourceName(a).localeCompare(sourceName(b))));
  }, [all]);
  const list = useMemo(() => sortReviews(source === 'all' ? all : all.filter((r) => r.source === source), sort), [all, source, sort]);
  const rating = useMemo(() => combinedRating(site.summary), [site.summary]);

  const pick = (value) => {
    setSource(value);
    setShown(PAGE_SIZE);
  };

  const chip = (active) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${
      active ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
    }`;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 scroll-mt-24 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <h2 id="reviews-heading" className="text-2xl font-bold tracking-tight text-slate-900">
          All customer reviews
        </h2>
        <p className="mt-1 text-sm text-slate-500">From our customers here on CureNeed and on the platforms where they buy from us.</p>
      </div>

      {site.status === 'loading' ? (
        <div className="mt-8 grid animate-pulse gap-8 lg:grid-cols-[300px_1fr]" aria-busy="true" aria-label="Loading reviews">
          <div className="h-64 rounded-2xl bg-slate-100" />
          <div className="space-y-4">
            <div className="h-24 rounded-2xl bg-slate-100" />
            <div className="h-24 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-6 ring-1 ring-slate-100">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Overall rating</div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-extrabold leading-none tracking-tight text-slate-900">{rating.average.toFixed(1)}</span>
                <span className="pb-1 text-sm font-medium text-slate-500">out of 5</span>
              </div>
              <Stars value={rating.average} size="lg" className="mt-3" />
              <p className="mt-2 text-sm text-slate-600">Combined across {rating.platforms.map((p) => p.name).join(' and ')}</p>

              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4" aria-label="Rating on each platform">
                {rating.platforms.map((p) => (
                  <li key={p.key} className="flex items-center justify-between gap-3 text-sm">
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 hover:text-emerald-700 hover:underline">
                        {p.name} <span aria-hidden="true">{'↗'}</span>
                      </a>
                    ) : (
                      <span className="font-semibold text-slate-700">{p.name}</span>
                    )}
                    <span className="flex items-center gap-2">
                      <Stars value={p.rating} size="xs" />
                      <span className="w-7 text-right font-semibold tabular-nums text-slate-900">{p.rating.toFixed(1)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setWriting(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.8)] transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M13.6 3.2a2 2 0 012.8 2.8l-8.7 8.7-3.6.8.8-3.6z" />
              </svg>
              Write a review
            </button>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Show reviews from">
                <button type="button" aria-pressed={source === 'all'} onClick={() => pick('all')} className={chip(source === 'all')}>
                  All
                </button>
                {sources.map((key) => (
                  <button key={key} type="button" aria-pressed={source === key} onClick={() => pick(key)} className={chip(source === key)}>
                    {sourceName(key)}
                  </button>
                ))}
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

            {list.slice(0, shown).map((review) => (
              <ReviewCard key={review.id} review={review} showSource showProduct />
            ))}

            {list.length > shown && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShown((n) => n + PAGE_SIZE)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Show more reviews
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ReviewModal
        open={writing}
        onClose={() => setWriting(false)}
        onSubmitted={() => {
          setSource('all');
          setSort('newest');
          setVersion((v) => v + 1);
        }}
      />
    </section>
  );
}
