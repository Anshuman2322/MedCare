import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StarInput from './StarInput.jsx';
import Stars from './Stars.jsx';
import { TopicPicker, DraftSuggestions } from './ReviewAssistant.jsx';
import { MAX_TOPICS, PRODUCT_TOPIC_ORDER, STORE_TOPIC_ORDER } from './topics.js';
import { submitReview } from '../../api/reviews';

const Motion = motion;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|xyz|ru|top|shop)\b)/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Reviews go live straight away, so contact details stay out of them (same rule as the server).
const CONTACT_IN_TEXT = /[^\s@]+@[^\s@]+\.[a-z]{2,}|(?:\+?\d[\s().-]?){9,}/i;
const capitalise = (word) => (word ? word[0].toUpperCase() + word.slice(1) : '');
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'India', 'Ireland', 'Germany',
  'France', 'Netherlands', 'United Arab Emirates', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Singapore', 'Malaysia',
  'Philippines', 'South Africa', 'Bangladesh', 'Nepal', 'Sri Lanka',
];
const EMPTY = { rating: 0, topics: [], title: '', body: '', name: '', country: '', email: '', website: '', assisted: false };

function validate(form) {
  const errors = {};
  if (!form.rating) errors.rating = 'Please choose a star rating.';
  const body = form.body.trim();
  if (body.length < 10) errors.body = 'Please write at least 10 characters.';
  else if (body.length > 1000) errors.body = 'Please keep it under 1000 characters.';
  else if (CONTACT_IN_TEXT.test(body) || CONTACT_IN_TEXT.test(form.title)) errors.body = 'Please remove phone numbers and email addresses from your review.';
  else if (LINK.test(body) || LINK.test(form.title)) errors.body = 'Please remove links from your review.';
  const name = form.name.trim();
  if (name.length < 2) errors.name = 'Please enter your name.';
  else if (LINK.test(name)) errors.name = 'Please enter just your name.';
  if (form.email.trim() && !EMAIL.test(form.email.trim())) errors.email = 'Please enter a valid email or leave it empty.';
  return errors;
}

const inputClass = (error) =>
  `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-4 ${
    error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
  }`;

function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-slate-800">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

/**
 * "Write a review" dialog. With `product` the review is for that product;
 * without it, it is a review of CureNeed. Reviews are published straight away;
 * `onSubmitted(review)` lets the page show the new review at once.
 */
export default function ReviewModal({ open, onClose, product = null, onSubmitted }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [serverError, setServerError] = useState('');
  const dialogRef = useRef(null);
  const returnFocus = useRef(null);
  const ids = useId();
  const fieldId = (name) => `${ids}-${name}`;

  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement;
    setForm(EMPTY);
    setErrors({});
    setStatus('idle');
    setServerError('');
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => dialogRef.current?.querySelector('[role="radio"]')?.focus(), 60);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = overflow;
      returnFocus.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && status !== 'sending') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      // Keep keyboard focus inside the dialog.
      const focusable = [...dialogRef.current.querySelectorAll('button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.disabled && el.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, status]);

  const set = (key) => (event) => {
    const value = typeof event === 'number' || Array.isArray(event) ? event : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // A picked draft fills the review (and the headline); the customer can still edit both.
  const [flashBody, setFlashBody] = useState(false);
  const pickDraft = (draft) => {
    setForm((prev) => ({ ...prev, title: draft.title, body: draft.body, assisted: true }));
    setErrors((prev) => ({ ...prev, body: undefined }));
    // Bring the filled box into view (without focusing it, so phones don't pop the keyboard).
    setFlashBody(true);
    window.setTimeout(() => document.getElementById(fieldId('body'))?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }), 60);
    window.setTimeout(() => setFlashBody(false), 1400);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const firstKey = ['rating', 'body', 'name', 'email'].find((k) => found[k]);
      const target = firstKey === 'rating' ? dialogRef.current?.querySelector('[role="radio"]') : document.getElementById(fieldId(firstKey));
      target?.focus();
      return;
    }
    setStatus('sending');
    setServerError('');
    try {
      const result = await submitReview({
        rating: form.rating,
        title: form.title.trim(),
        body: form.body.trim(),
        name: form.name.trim(),
        country: form.country.trim(),
        email: form.email.trim(),
        website: form.website,
        topics: form.topics,
        assisted: form.assisted,
        ...(product?.slug ? { product: product.slug } : {}),
      });
      setStatus('done');
      onSubmitted?.(result?.review);
    } catch (error) {
      setServerError(error.message);
      setStatus('idle');
    }
  };

  const firstName = capitalise(form.name.trim().split(/\s+/)[0]);
  const bodyLength = form.body.trim().length;

  return createPortal(
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && status !== 'sending') onClose();
          }}
        >
          <Motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={fieldId('title-heading')}
            className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 pb-4 pt-6">
              <div className="min-w-0">
                <h2 id={fieldId('title-heading')} className="text-xl font-bold text-slate-900">
                  {status === 'done' ? 'Review received' : 'Write a review'}
                </h2>
                {(status !== 'done' || product) && (
                  <p className="mt-0.5 truncate text-sm text-slate-500">{product ? product.name : 'Tell others about your experience with CureNeed'}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={status === 'sending'}
                aria-label="Close"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </div>

            {status === 'done' ? (
              <div className="px-6 pb-8 pt-8 text-center">
                <Motion.div
                  className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                >
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </Motion.div>
                <p className="mt-5 text-xl font-bold text-slate-900">Thank you{firstName ? `, ${firstName}` : ''}!</p>
                <div className="mt-3 flex justify-center">
                  <Stars value={form.rating} size="lg" />
                </div>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
                  We've received your review. Thanks for taking the time to share your experience.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200"
                >
                  Done
                </button>
              </div>
            ) : (
              <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Your rating</div>
                    <div className="mt-1.5">
                      <StarInput id={fieldId('rating')} value={form.rating} onChange={set('rating')} error={errors.rating} />
                    </div>
                  </div>

                  <div>
                    <div id={fieldId('topics-label')} className="flex items-baseline justify-between gap-2 text-sm font-semibold text-slate-800">
                      <span>What would you like to mention?</span>
                      <span className="text-xs font-normal text-slate-400">
                        {form.topics.length ? `${form.topics.length}/${MAX_TOPICS} chosen` : `Optional · up to ${MAX_TOPICS}`}
                      </span>
                    </div>
                    <div className="mt-2">
                      <TopicPicker
                        id={fieldId('topics-label')}
                        value={form.topics}
                        onChange={set('topics')}
                        order={product ? PRODUCT_TOPIC_ORDER : STORE_TOPIC_ORDER}
                      />
                    </div>
                  </div>

                  <DraftSuggestions
                    rating={form.rating}
                    topics={form.topics}
                    product={product}
                    notes={form.assisted ? '' : form.body}
                    pickedBody={form.body}
                    onPick={pickDraft}
                  />

                  <Field label="Your review" hint={`${bodyLength}/1000`} error={errors.body} htmlFor={fieldId('body')}>
                    <textarea
                      id={fieldId('body')}
                      rows={4}
                      maxLength={1000}
                      value={form.body}
                      onChange={set('body')}
                      aria-invalid={Boolean(errors.body)}
                      aria-describedby={errors.body ? `${fieldId('body')}-error` : undefined}
                      placeholder={
                        product
                          ? 'Write in your own words, or tap "Write it for me" above.'
                          : 'How was your experience with our team, quotes and delivery? Or tap "Write it for me" above.'
                      }
                      className={`${inputClass(errors.body)} resize-none ${flashBody ? 'border-emerald-400 ring-4 ring-emerald-100' : ''}`}
                    />
                  </Field>

                  <Field label="Headline" hint="Optional" htmlFor={fieldId('title')}>
                    <input id={fieldId('title')} type="text" maxLength={80} value={form.title} onChange={set('title')} placeholder="Sum it up in a few words" className={inputClass()} />
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Your name" error={errors.name} htmlFor={fieldId('name')}>
                      <input
                        id={fieldId('name')}
                        type="text"
                        autoComplete="name"
                        maxLength={60}
                        value={form.name}
                        onChange={set('name')}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? `${fieldId('name')}-error` : undefined}
                        placeholder="e.g. Sarah Miller"
                        className={inputClass(errors.name)}
                      />
                    </Field>
                    <Field label="Country" hint="Optional" htmlFor={fieldId('country')}>
                      <input id={fieldId('country')} type="text" list={fieldId('countries')} autoComplete="country-name" maxLength={60} value={form.country} onChange={set('country')} placeholder="Start typing" className={inputClass()} />
                      <datalist id={fieldId('countries')}>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </Field>
                  </div>

                  <Field label="Email" hint="Optional · never shown" error={errors.email} htmlFor={fieldId('email')}>
                    <input
                      id={fieldId('email')}
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={set('email')}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? `${fieldId('email')}-error` : undefined}
                      placeholder="So we can thank you or follow up"
                      className={inputClass(errors.email)}
                    />
                  </Field>

                  {/* Hidden from people; bots that fill it are ignored by the server. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    <label htmlFor={fieldId('website')}>Website</label>
                    <input id={fieldId('website')} type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                  </div>

                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
                    Your review is shown with your first name and the initial of your surname. Please don't share phone numbers, email addresses or personal medical details.
                  </p>

                  {serverError && (
                    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {serverError}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                  <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-wait disabled:opacity-70"
                  >
                    {status === 'sending' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                    {status === 'sending' ? 'Sending…' : 'Submit review'}
                  </button>
                </div>
              </form>
            )}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
