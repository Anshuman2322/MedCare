import React, { useRef, useState } from 'react';
import { StarShape } from './Stars.jsx';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/**
 * Accessible 1–5 star picker: a radio group with hover preview, arrow-key
 * support and a word for the chosen rating.
 */
export default function StarInput({ value, onChange, error, id = 'review-rating' }) {
  const [hover, setHover] = useState(0);
  const buttons = useRef([]);
  const shown = hover || value || 0;

  const choose = (n) => {
    onChange(n);
    buttons.current[n - 1]?.focus();
  };

  const onKeyDown = (event) => {
    const current = value || 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      choose(Math.min(5, current + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      choose(Math.max(1, current - 1));
    }
  };

  return (
    <div>
      <div
        id={id}
        role="radiogroup"
        aria-label="Your rating"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-label`}
        className="flex items-center gap-1"
        onMouseLeave={() => setHover(0)}
        onKeyDown={onKeyDown}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            ref={(el) => {
              buttons.current[n - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}, ${RATING_LABELS[n]}`}
            tabIndex={(value || 1) === n ? 0 : -1}
            onClick={() => choose(n)}
            onMouseEnter={() => setHover(n)}
            className="rounded-md p-0.5 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <StarShape className={`h-9 w-9 transition-colors duration-150 ${n <= shown ? 'text-amber-400' : 'text-slate-200'}`} />
          </button>
        ))}
      </div>
      <div id={`${id}-label`} className="mt-1 h-5 text-sm font-semibold text-amber-600" aria-live="polite">
        {shown ? RATING_LABELS[shown] : <span className="font-medium text-slate-400">Tap a star to rate</span>}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
