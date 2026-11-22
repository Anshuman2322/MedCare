import React, { useCallback, useEffect, useState } from 'react';
import Modal from '../components/ui/Modal.jsx';
import { getReviews, updateReview, deleteReview, markReviewsSeen, announceReviewsChanged } from '../api/reviewsApi.js';

const SITE_ORIGIN = (import.meta.env.VITE_MEDICINE_ASSET_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

// Reviews go live as soon as customers post them; "Waiting" only appears for
// reviews posted before that, and disappears once there are none.
const TABS = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Live on website' },
  { value: 'rejected', label: 'Hidden' },
  { value: 'pending', label: 'Waiting', onlyIfAny: true },
];

const STATUS = {
  approved: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Hidden', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  pending: { label: 'Waiting', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
};

const TOPIC_LABELS = {
  prices: 'Prices',
  quote: 'Quick quotes',
  support: 'Customer support',
  delivery: 'Delivery',
  packaging: 'Packaging',
  quality: 'Product quality',
  ordering: 'Easy ordering',
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

function Stars({ value }) {
  return (
    <span className="text-base leading-none tracking-[1px]" aria-label={`${value} out of 5 stars`}>
      <span className="text-amber-400">{'★'.repeat(value)}</span>
      <span className="text-slate-200">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

function Pill({ className, title, children }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${className}`}>
      {children}
    </span>
  );
}

function ActionButton({ tone = 'slate', busy, children, ...props }) {
  const tones = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 border-transparent',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    slate: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  };
  return (
    <button
      type="button"
      disabled={busy}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${tones[tone]}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ReviewItem({ review, busy, onChange, onDelete }) {
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState(review.reply || '');

  useEffect(() => setDraft(review.reply || ''), [review.reply]);

  const saveReply = async () => {
    const ok = await onChange(review, { reply: draft.trim() });
    if (ok) setReplying(false);
  };

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={review.rating} />
            {review.isNew && <Pill className="bg-blue-600 text-white ring-blue-600">New</Pill>}
            <Pill className={STATUS[review.status]?.className}>{STATUS[review.status]?.label || review.status}</Pill>
            {review.featured && <Pill className="bg-violet-50 text-violet-700 ring-violet-200">Pinned on home</Pill>}
            {review.verifiedBuyer && <Pill className="bg-sky-50 text-sky-700 ring-sky-200">Verified buyer</Pill>}
            {review.assisted && (
              <Pill className="bg-slate-50 text-slate-600 ring-slate-200" title="The customer started from a suggested draft and posted it under their name">
                Drafted with suggestions
              </Pill>
            )}
          </div>
          {review.title && <h3 className="mt-2 font-semibold text-slate-900">{review.title}</h3>}
        </div>
        <div className="text-xs text-slate-500">{formatDate(review.createdAt)}</div>
      </div>

      {review.topics?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.topics.map((topic) => (
            <span key={topic} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
              {TOPIC_LABELS[topic] || topic}
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{review.body}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="font-semibold text-slate-800">{review.name}</span>
        {review.country && <span>{review.country}</span>}
        {review.email ? (
          <a href={`mailto:${review.email}`} className="text-emerald-700 hover:underline">
            {review.email}
          </a>
        ) : (
          <span className="italic">no email given</span>
        )}
        <span aria-hidden="true">·</span>
        {review.product ? (
          <a href={`${SITE_ORIGIN}/medicine/${review.product.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 hover:text-emerald-700">
            {review.product.name}
            {!review.product.isPublished && <span className="ml-1 text-rose-600">(hidden product)</span>}
          </a>
        ) : (
          <span className="font-medium text-slate-700">Review of CureNeed (no product)</span>
        )}
      </div>

      {review.reply && !replying && (
        <div className="mt-4 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/60 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Your reply</div>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{review.reply}</p>
        </div>
      )}

      {replying && (
        <div className="mt-4">
          <textarea
            rows={3}
            maxLength={1000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Thank the customer or answer their question. This is shown publicly under the review."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            autoFocus
          />
          <div className="mt-2 flex gap-2">
            <ActionButton tone="emerald" busy={busy} onClick={saveReply}>
              Save reply
            </ActionButton>
            <ActionButton
              busy={busy}
              onClick={() => {
                setReplying(false);
                setDraft(review.reply || '');
              }}
            >
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {review.status === 'approved' ? (
          <>
            <ActionButton tone="rose" busy={busy} onClick={() => onChange(review, { status: 'rejected' })}>
              Hide from website
            </ActionButton>
            <ActionButton tone={review.featured ? 'amber' : 'slate'} busy={busy} onClick={() => onChange(review, { featured: !review.featured })}>
              {review.featured ? 'Unpin from home page' : 'Pin to top of home page'}
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton tone="emerald" busy={busy} onClick={() => onChange(review, { status: 'approved' })}>
              {review.status === 'rejected' ? 'Show on website again' : 'Publish on website'}
            </ActionButton>
            {review.status === 'pending' && (
              <ActionButton tone="rose" busy={busy} onClick={() => onChange(review, { status: 'rejected' })}>
                Hide
              </ActionButton>
            )}
          </>
        )}
        <ActionButton busy={busy} onClick={() => onChange(review, { verifiedBuyer: !review.verifiedBuyer })}>
          {review.verifiedBuyer ? 'Remove verified badge' : 'Mark verified buyer'}
        </ActionButton>
        {!replying && (
          <ActionButton busy={busy} onClick={() => setReplying(true)}>
            {review.reply ? 'Edit reply' : 'Reply'}
          </ActionButton>
        )}
        <span className="flex-1" />
        <ActionButton tone="rose" busy={busy} onClick={() => onDelete(review)}>
          Delete
        </ActionButton>
      </div>
    </article>
  );
}

export default function Reviews() {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ reviews: [], counts: { pending: 0, approved: 0, rejected: 0, unseen: 0 }, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  // Reviews that were new when this visit started keep their "New" tag until
  // the page is left, even though they are marked as seen straight away.
  const [newIds, setNewIds] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReviews({ status: tab, page, limit: 20 });
      setData(res.data);
      setError('');
      const fresh = res.data.reviews.filter((r) => r.isNew).map((r) => r.id);
      if (fresh.length) setNewIds((prev) => new Set([...prev, ...fresh]));
      if (res.data.counts?.unseen) {
        await markReviewsSeen();
        announceReviewsChanged();
      }
    } catch {
      setError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    load();
  }, [load]);

  const change = async (review, changes) => {
    setBusyId(review.id);
    setError('');
    try {
      await updateReview(review.id, changes);
      announceReviewsChanged();
      await load();
      return true;
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not update the review.');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const review = toDelete;
    setToDelete(null);
    setBusyId(review.id);
    try {
      await deleteReview(review.id);
      announceReviewsChanged();
      await load();
    } catch {
      setError('Could not delete the review.');
    } finally {
      setBusyId(null);
    }
  };

  const countFor = (value) => (value === 'all' ? data.counts.pending + data.counts.approved + data.counts.rejected : data.counts[value] || 0);
  const tabs = TABS.filter((t) => !t.onlyIfAny || countFor(t.value) > 0 || tab === t.value);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="section-title">Customers</div>
          <h2 className="text-xl font-semibold">Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customer reviews go live on the website and the home page as soon as they are posted, newest first. Pin a review to keep it at the top of the
            home page, or hide any review you don't want shown and bring it back any time.
          </p>
        </div>
        <button type="button" onClick={load} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Refresh
        </button>
      </div>

      <div role="tablist" aria-label="Review status" className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(t.value);
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                active ? 'border-emerald-600 bg-emerald-600 text-white shadow-card' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? 'bg-white/20' : t.value === 'pending' && countFor('pending') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                {countFor(t.value)}
              </span>
            </button>
          );
        })}
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading && !data.reviews.length ? (
        <div className="card p-8 text-center text-slate-500">Loading…</div>
      ) : data.reviews.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-3xl" aria-hidden="true">
            {'★'}
          </div>
          <div className="mt-2 font-semibold text-slate-900">{tab === 'rejected' ? 'No hidden reviews' : 'No reviews yet'}</div>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'rejected'
              ? 'Reviews you hide from the website will be listed here.'
              : 'Reviews customers post on the website will show up here straight away.'}
          </p>
        </div>
      ) : (
        <div className={`space-y-4 ${loading ? 'opacity-60' : ''}`}>
          {data.reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={{ ...review, isNew: review.isNew || newIds.has(review.id) }}
              busy={busyId === review.id}
              onChange={change}
              onDelete={setToDelete}
            />
          ))}
        </div>
      )}

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">
            Previous
          </button>
          <span className="text-slate-500">
            Page {page} of {data.pages}
          </span>
          <button type="button" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      <Modal
        open={Boolean(toDelete)}
        title="Delete review"
        description={`This permanently removes ${toDelete?.name || 'this customer'}'s review. To take it off the website but keep it, use "Hide from website" instead.`}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        tone="danger"
      />
    </div>
  );
}
