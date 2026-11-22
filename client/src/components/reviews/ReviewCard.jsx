import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Stars from './Stars.jsx';
import SourceBadge from './SourceBadge.jsx';
import { formatReviewDate, initials } from './format.js';
import { topicLabel } from './topics.js';

function VerifiedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
      </svg>
      Verified buyer
    </span>
  );
}

const PillIcon = () => (
  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="3" y="7.5" width="14" height="5" rx="2.5" />
    <path d="M10 7.5v5" />
  </svg>
);

/**
 * One review in a list. Takes the shared shape from combined.js
 * (fromSiteReview / fromExternalReview). `showSource` adds the platform badge
 * for mixed lists; `showProduct` adds the product the review is about.
 */
export default function ReviewCard({ review, showSource = false, showProduct = false }) {
  const [expanded, setExpanded] = useState(false);
  const long = review.body.length > 280;
  const chip = 'mb-2 inline-flex max-w-full items-center gap-1.5 truncate rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100';

  return (
    <article className="border-b border-slate-100 py-6 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100" aria-hidden="true">
          {initials(review.author)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-900">{review.author}</span>
            {review.place && <span className="text-sm text-slate-500">· {review.place}</span>}
            {!showSource && review.verifiedBuyer && <VerifiedPill />}
            {showSource && (
              <span className="ml-auto">
                <SourceBadge source={review.source} verifiedBuyer={review.verifiedBuyer} />
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {review.rating != null && <Stars value={review.rating} size="sm" />}
            <time dateTime={review.date} className="text-xs text-slate-400">
              {formatReviewDate(review.date)}
            </time>
          </div>
        </div>
      </div>
      <div className="mt-3 sm:pl-[52px]">
        {showProduct &&
          review.product &&
          (review.product.slug ? (
            <Link to={`/medicine/${review.product.slug}`} className={`${chip} hover:text-emerald-700 hover:ring-emerald-200`}>
              <PillIcon />
              <span className="truncate">{review.product.name}</span>
            </Link>
          ) : (
            <span className={chip}>
              <PillIcon />
              <span className="truncate">{review.product.name}</span>
            </span>
          ))}
        {review.title && <h4 className="font-semibold text-slate-900">{review.title}</h4>}
        {review.topics?.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Review topics">
            {review.topics.map((topic) => (
              <li key={topic} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                {topicLabel(topic)}
              </li>
            ))}
          </ul>
        )}
        <p className={`mt-1 whitespace-pre-line text-[15px] leading-7 text-slate-700 ${long && !expanded ? 'line-clamp-4' : ''}`}>{review.body}</p>
        {long && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
        {review.reply && (
          <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/60 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Response from CureNeed</div>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{review.reply}</p>
          </div>
        )}
      </div>
    </article>
  );
}
