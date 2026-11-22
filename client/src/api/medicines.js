const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function handleResponse(res) {
  if (!res.ok) {
    const message = await res.text();
    const error = new Error(message || res.statusText);
    // Callers can tell "this doesn't exist" (404) from "the server is struggling" (5xx).
    error.status = res.status;
    throw error;
  }
  return res.json();
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

// The home page mounts several components that all load the full list at once
// (navbar search, brand strip, stats, featured). They share one request while it
// is in flight; nothing is cached after it settles, so data is never stale.
const inFlight = new Map();

export async function fetchMedicines(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  if (params.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  const url = buildUrl(`/api/medicines${query ? `?${query}` : ''}`);
  let request = inFlight.get(url);
  if (!request) {
    request = fetch(url)
      .then(handleResponse)
      .finally(() => inFlight.delete(url));
    inFlight.set(url, request);
  }
  const data = await request;
  // Each caller gets its own array, so sorting or filtering in one cannot affect another.
  return Array.isArray(data) ? data.slice() : data;
}

export async function fetchMedicine(slug) {
  if (!slug) throw new Error('slug is required');
  const res = await fetch(buildUrl(`/api/medicines/${slug}`));
  return handleResponse(res);
}
