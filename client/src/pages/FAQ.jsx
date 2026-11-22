import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SEO from '../components/SEO.jsx';
import { CONTACT } from '../config/contact.js';
import OrderSteps from '../components/OrderSteps.jsx';
import { fetchFaq, searchFaq, sendFaqFeedback } from '../api/faq.js';

const VOTES_KEY = 'cureneed-faq-votes';

function readVotes() {
  try {
    return JSON.parse(window.localStorage.getItem(VOTES_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function saveVote(id, helpful) {
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify({ ...readVotes(), [id]: helpful }));
  } catch {
    /* storage unavailable: the vote still counts for this visit */
  }
}

const openChat = () => window.dispatchEvent(new Event('cureneed:open-chat'));

function Skeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading questions">
      {[0, 1, 2, 3, 4].map((item) => (
        <div key={item} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}

function Feedback({ id }) {
  const [vote, setVote] = useState(() => readVotes()[id]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const send = async (helpful) => {
    if (busy || vote !== undefined) return;
    setBusy(true);
    setFailed(false);
    try {
      await sendFaqFeedback(id, helpful);
      saveVote(id, helpful);
      setVote(helpful);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (vote !== undefined) {
    return (
      <p className="text-sm text-emerald-700" role="status">
        {vote ? 'Thanks for your feedback!' : "Thanks, we'll work on it. Our team can help you directly below."}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      <span>Was this helpful?</span>
      <button type="button" disabled={busy} onClick={() => send(true)} className="rounded-full border border-gray-200 px-3 py-1 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-60">
        👍 Yes
      </button>
      <button type="button" disabled={busy} onClick={() => send(false)} className="rounded-full border border-gray-200 px-3 py-1 hover:border-rose-400 hover:text-rose-600 disabled:opacity-60">
        👎 No
      </button>
      {failed && <span className="text-rose-600">Couldn't save that. Please try again.</span>}
    </div>
  );
}

function Item({ item, open, onToggle, byId, onOpenRelated, categoryLabel }) {
  const panelId = `faq-panel-${item.id}`;
  const related = (item.related || []).map((id) => byId.get(id)).filter(Boolean);
  return (
    <li id={`faq-${item.id}`} className="rounded-xl border border-gray-200 bg-white shadow-sm scroll-mt-28">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
        >
          <span className="font-semibold text-gray-900">{item.question}</span>
          <span aria-hidden="true" className={`mt-1 shrink-0 text-emerald-600 transition-transform ${open ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>
      </h3>
      {open && (
        <div id={panelId} role="region" aria-label={item.question} className="space-y-4 border-t border-gray-100 px-4 pb-5 pt-4 sm:px-5">
          <p className="whitespace-pre-line text-gray-700 leading-relaxed">{item.answer}</p>
          {categoryLabel && <p className="text-xs uppercase tracking-wide text-gray-400">{categoryLabel}</p>}
          {item.links?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.links.map((link) => (
                <Link key={link.to + link.label} to={link.to} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
                  {link.label} →
                </Link>
              ))}
            </div>
          )}
          {item.escalate && (
            <p className="text-sm text-gray-600">
              Need more help with this?{' '}
              <button type="button" onClick={openChat} className="font-medium text-emerald-700 underline underline-offset-2">
                Talk to our team
              </button>
            </p>
          )}
          {related.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-gray-900">Related questions</p>
              <ul className="space-y-1">
                {related.map((other) => (
                  <li key={other.id}>
                    <button type="button" onClick={() => onOpenRelated(other.id)} className="text-left text-sm text-emerald-700 hover:underline">
                      {other.question}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Feedback id={item.id} />
        </div>
      )}
    </li>
  );
}

export default function FAQ() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [openId, setOpenId] = useState(() => (typeof window !== 'undefined' ? window.location.hash.replace('#faq-', '') : '') || '');
  const [ranked, setRanked] = useState(null); // ids ranked by the server's typo-tolerant search, or null
  const searchSeq = useRef(0);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetchFaq()
      .then((payload) => setData(payload))
      .catch(() => setError("We couldn't load the questions right now."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const byId = useMemo(() => new Map((data?.items || []).map((item) => [item.id, item])), [data]);
  const categoryById = useMemo(() => new Map((data?.categories || []).map((item) => [item.id, item])), [data]);

  // Keep the address bar shareable: ?q=... &category=...
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query.trim());
    if (category !== 'all') next.set('category', category);
    setParams(next, { replace: true });
  }, [query, category, setParams]);

  // Typo-tolerant search on the server (the same matcher the chat uses). Until it answers,
  // a plain "contains" filter keeps the list responsive; if the server fails, that filter stays.
  useEffect(() => {
    const text = query.trim();
    if (!text) {
      setRanked(null);
      return undefined;
    }
    const seq = (searchSeq.current += 1);
    const timer = setTimeout(() => {
      searchFaq(text)
        .then((result) => {
          if (searchSeq.current === seq) setRanked(result.results.map((entry) => entry.id));
        })
        .catch(() => {
          if (searchSeq.current === seq) setRanked(null);
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const visible = useMemo(() => {
    const items = data?.items || [];
    const inCategory = category === 'all' ? items : items.filter((item) => item.category === category);
    const text = query.trim().toLowerCase();
    if (!text) return inCategory;
    if (ranked) {
      const order = new Map(ranked.map((id, index) => [id, index]));
      return inCategory.filter((item) => order.has(item.id)).sort((a, b) => order.get(a.id) - order.get(b.id));
    }
    return inCategory.filter((item) =>
      [item.question, item.answer, ...(item.alternatives || []), ...(item.keywords || [])].join(' ').toLowerCase().includes(text)
    );
  }, [data, category, query, ranked]);

  // Open a deep-linked question once the list is there.
  useEffect(() => {
    if (!openId || !data) return;
    const target = document.getElementById(`faq-${openId}`);
    if (target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const openRelated = (id) => {
    setCategory('all');
    setQuery('');
    setOpenId(id);
    requestAnimationFrame(() => document.getElementById(`faq-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  const popular = (data?.popular || []).map((id) => byId.get(id)).filter(Boolean).slice(0, 6);
  const showPopular = !query.trim() && category === 'all' && popular.length > 0;
  const support = data?.support || { email: CONTACT.email, phone: CONTACT.phone };

  const jsonLd = data
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      })
    : '';

  return (
    <div className="bg-white min-h-screen">
      <SEO title="FAQ" description="Answers about ordering, prices, prescriptions, shipping, payments and support at CureNeed." path="/faq" />
      {jsonLd && (
        <Helmet>
          <script type="application/ld+json">{jsonLd}</script>
        </Helmet>
      )}

      <div className="w-full bg-sky-50/60">
        <div className="mx-auto max-w-4xl px-4 pb-8 pt-8 text-center sm:px-6 sm:pt-12 lg:px-8">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">Frequently asked questions</h1>
          <p className="mb-6 text-sm text-gray-600 sm:text-base">Quick answers about ordering, prices, prescriptions, shipping and support.</p>
          <div className="mx-auto max-w-xl">
            <label htmlFor="faq-search" className="sr-only">
              Search questions
            </label>
            <div className="relative">
              <input
                id="faq-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search, e.g. “shipping to Canada” or “refund”"
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-5 pr-12 text-base shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                autoComplete="off"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 text-gray-500 hover:text-gray-900">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {loading && <Skeleton />}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
            <p className="mb-3 text-rose-700">{error}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={load} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                Try again
              </button>
              <Link to="/contact" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white">
                Contact us
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter by category">
              <div className="flex gap-2 pb-1 sm:flex-wrap">
                {[{ id: 'all', label: 'All', icon: '📚' }, ...data.categories].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                    className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      category === item.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-400'
                    }`}
                  >
                    <span aria-hidden="true">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            </div>

            {showPopular && (
              <section aria-labelledby="faq-popular">
                <h2 id="faq-popular" className="mb-3 text-lg font-semibold text-gray-900">
                  Popular questions
                </h2>
                <div className="flex flex-wrap gap-2">
                  {popular.map((item) => (
                    <button key={item.id} type="button" onClick={() => openRelated(item.id)} className="rounded-full bg-emerald-50 px-3 py-1.5 text-left text-sm text-emerald-800 hover:bg-emerald-100">
                      {item.question}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section aria-live="polite">
              <p className="mb-3 text-sm text-gray-500">
                {visible.length} {visible.length === 1 ? 'question' : 'questions'}
                {query.trim() ? ` for “${query.trim()}”` : ''}
              </p>
              {visible.length > 0 ? (
                <ul className="space-y-3">
                  {visible.map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      open={openId === item.id}
                      onToggle={() => setOpenId(openId === item.id ? '' : item.id)}
                      byId={byId}
                      onOpenRelated={openRelated}
                      categoryLabel={categoryById.get(item.category)?.label}
                    />
                  ))}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <p className="mb-1 font-semibold text-gray-900">No matching question</p>
                  <p className="mb-4 text-sm text-gray-600">I don't have verified information about that yet. Please contact our support team, and they will be able to assist you.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={() => { setQuery(''); setCategory('all'); }} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Clear search
                    </button>
                    <button type="button" onClick={openChat} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                      Ask our team
                    </button>
                  </div>
                </div>
              )}
            </section>

            <OrderSteps heading="New here? How ordering works" />

            <nav aria-label="Related pages" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <Link to="/shipping-policy" className="text-emerald-700 hover:underline">Shipping Policy</Link>
              <Link to="/privacy-policy" className="text-emerald-700 hover:underline">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-emerald-700 hover:underline">Terms of Service</Link>
              <Link to="/reviews" className="text-emerald-700 hover:underline">Customer reviews</Link>
              <Link to="/about" className="text-emerald-700 hover:underline">About CureNeed</Link>
            </nav>

            <section aria-labelledby="faq-support" className="rounded-2xl bg-emerald-50 p-6 text-center sm:p-8">
              <h2 id="faq-support" className="mb-1 text-xl font-bold text-gray-900">
                Still need help?
              </h2>
              <p className="mb-4 text-sm text-gray-600 sm:text-base">Our team will answer anything that is not covered here.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={openChat} className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                  💬 Chat with us
                </button>
                <a href={`mailto:${support.email}`} className="rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-white">
                  ✉️ {support.email}
                </a>
                <a href={CONTACT.phoneHref} className="rounded-full border border-emerald-600 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-white">
                  📞 {support.phone}
                </a>
                <Link to="/contact" className="rounded-full px-3 py-2.5 text-sm font-semibold text-emerald-700 underline underline-offset-2">
                  Contact page
                </Link>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
