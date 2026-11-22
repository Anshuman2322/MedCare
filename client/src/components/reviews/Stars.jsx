import React from 'react';

const SIZES = { xs: 'h-3 w-3', sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-6 w-6', xl: 'h-9 w-9' };

export function StarShape({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={`shrink-0 ${className}`} aria-hidden="true">
      <path d="M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z" />
    </svg>
  );
}

/**
 * Read-only stars; fractional values fill partially (4.6 shows 4 and most of
 * the fifth). `onDark` uses colours that read on a dark background.
 */
export default function Stars({ value = 0, size = 'md', className = '', onDark = false }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const row = (tone) => (
    <span className={`flex ${tone}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <StarShape key={i} className={SIZES[size] || SIZES.md} />
      ))}
    </span>
  );
  return (
    <span className={`relative inline-flex ${className}`} role="img" aria-label={`Rated ${rating} out of 5`}>
      {row(onDark ? 'text-white/25' : 'text-slate-200')}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(rating / 5) * 100}%` }}>
        {row(onDark ? 'text-amber-300' : 'text-amber-400')}
      </span>
    </span>
  );
}
