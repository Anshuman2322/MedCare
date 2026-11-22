import React from 'react';
import { BUSINESS } from '../../config/business';
import { SITE_SOURCE } from './combined.js';

const TAG = 'inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide';

const Check = () => (
  <svg viewBox="0 0 20 20" className="h-3 w-3 shrink-0" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
  </svg>
);

/**
 * Where a review comes from, in one style everywhere:
 * "✓ Verified via IndiaMART" (links to that platform's reviews),
 * "✓ Verified buyer" for website reviews an admin verified, otherwise "On CureNeed".
 */
export default function SourceBadge({ source, verifiedBuyer = false }) {
  if (source && source !== SITE_SOURCE) {
    const platform = BUSINESS.reviewSources[source];
    if (!platform) return null;
    return (
      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`See this review on ${platform.name}`}
        className={`${TAG} rounded text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300`}
      >
        <Check />
        Verified via {platform.name}
      </a>
    );
  }
  return verifiedBuyer ? (
    <span className={`${TAG} text-emerald-700`}>
      <Check />
      Verified buyer
    </span>
  ) : (
    <span className={`${TAG} text-slate-400`}>On CureNeed</span>
  );
}
