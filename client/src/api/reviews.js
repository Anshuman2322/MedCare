const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.');
    error.status = res.status;
    throw error;
  }
  return data;
}

/** Approved reviews plus a summary. `product` is a slug or id; omit it for all reviews. */
export function fetchReviews({ product, sort, rating, page, limit } = {}) {
  const params = new URLSearchParams();
  if (product) params.set('product', product);
  if (sort) params.set('sort', sort);
  if (rating) params.set('rating', String(rating));
  if (page) params.set('page', String(page));
  if (limit) params.set('limit', String(limit));
  return fetch(`${API_BASE_URL}/api/reviews?${params}`).then(handle);
}

// The home page asks for this from the hero and the reviews section at once;
// they share one request while it is in flight (nothing is cached after).
let featuredInFlight = null;

/** Home-page reviews (pinned first, then newest) plus the site's rating summary. */
export function fetchFeaturedReviews() {
  if (!featuredInFlight) {
    featuredInFlight = fetch(`${API_BASE_URL}/api/reviews/featured`)
      .then(handle)
      .finally(() => {
        featuredInFlight = null;
      });
  }
  return featuredInFlight;
}

/** Draft reviews from { rating, topics, product?, notes? }. Resolves with { drafts: [{ title, body }], source }. */
export function suggestReviews(payload) {
  return fetch(`${API_BASE_URL}/api/reviews/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}

/** Posts a review; it is live at once. Resolves with { message, status, review }. */
export function submitReview(payload) {
  return fetch(`${API_BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle);
}
