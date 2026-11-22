import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { suggestReviews } from '../../api/reviews';
import { MAX_TOPICS, REVIEW_TOPICS } from './topics.js';

const Motion = motion;

const Sparkle = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
    <path d="M10 1.5l1.6 4.4 4.4 1.6-4.4 1.6L10 13.5 8.4 9.1 4 7.5l4.4-1.6zM15.5 12l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8zM4.5 13l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" />
  </svg>
);

/** Multi-select chips for what the review is about (up to MAX_TOPICS). */
export function TopicPicker({ id, value, onChange, order }) {
  const toggle = (key) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key));
    else if (value.length < MAX_TOPICS) onChange([...value, key]);
  };
  return (
    <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
      {order.map((key) => {
        const selected = value.includes(key);
        const full = !selected && value.length >= MAX_TOPICS;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={selected}
            disabled={full}
            onClick={() => toggle(key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-40 ${
              selected
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {selected && (
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4.5 10.5l3.5 3.5 7.5-8" />
              </svg>
            )}
            {REVIEW_TOPICS[key]}
          </button>
        );
      })}
    </div>
  );
}

/**
 * "Write it for me": drafts from the rating and topics (and any words the
 * customer already typed). Picking a draft fills the review box, where it
 * can still be edited.
 */
export function DraftSuggestions({ rating, topics, product, notes, pickedBody, onPick }) {
  const [state, setState] = useState({ status: 'idle', drafts: [], error: '' });
  const ready = rating > 0 && topics.length > 0;
  const usingNotes = notes.trim().split(/\s+/).filter(Boolean).length >= 3;

  const generate = async () => {
    if (!ready) return;
    setState((prev) => ({ ...prev, status: 'loading', error: '' }));
    try {
      const data = await suggestReviews({
        rating,
        topics,
        ...(product?.slug ? { product: product.slug } : {}),
        ...(usingNotes ? { notes: notes.trim().slice(0, 400) } : {}),
      });
      setState({ status: 'ready', drafts: data.drafts || [], error: '' });
    } catch (error) {
      setState((prev) => ({ ...prev, status: prev.drafts.length ? 'ready' : 'idle', error: error.message }));
    }
  };

  const loading = state.status === 'loading';
  const shown = state.drafts.length > 0 && state.status !== 'idle';

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Sparkle className="h-4 w-4 text-emerald-600" />
            Don't want to type?
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {ready
              ? usingNotes
                ? 'We will turn your words into a few polished versions.'
                : 'Get a few ready-made reviews from your rating and topics.'
              : 'Pick a star rating and at least one topic first.'}
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={!ready || loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          ) : (
            <Sparkle />
          )}
          {loading ? 'Writing…' : shown ? 'Try different wording' : usingNotes ? 'Polish my words' : 'Write it for me'}
        </button>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <AnimatePresence initial={false}>
        {shown && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Tap one to use it, then edit if you like</p>
            <ul className={`mt-2 grid gap-2 sm:grid-cols-2 ${loading ? 'opacity-50' : ''}`} aria-label="Suggested reviews">
              {state.drafts.map((draft, i) => {
                const picked = pickedBody === draft.body;
                return (
                  <li key={`${i}-${draft.title}`}>
                    <button
                      type="button"
                      aria-pressed={picked}
                      onClick={() => onPick(draft)}
                      className={`h-full w-full rounded-xl border bg-white p-3 text-left transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 ${
                        picked ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{draft.title}</span>
                        {picked && <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Selected</span>}
                      </span>
                      <span className="mt-1 block text-[13px] leading-5 text-slate-600">{draft.body}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
