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

/** The whole FAQ knowledge base: { categories, items, popular, support }. */
export function fetchFaq() {
  return fetch(`${API_BASE_URL}/api/faq`).then(handle);
}

/** Typo-tolerant ranked search over the same knowledge base the chat uses: { best, results: [{ id, score }] }. */
export function searchFaq(q, category = '') {
  const params = new URLSearchParams({ q });
  if (category) params.set('category', category);
  return fetch(`${API_BASE_URL}/api/faq/search?${params}`).then(handle);
}

/** "Was this helpful?" vote for one question. */
export function sendFaqFeedback(id, helpful) {
  return fetch(`${API_BASE_URL}/api/faq/${encodeURIComponent(id)}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ helpful }),
  }).then(handle);
}
