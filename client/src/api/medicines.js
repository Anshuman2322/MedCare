const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function handleResponse(res) {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || res.statusText);
  }
  return res.json();
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function fetchMedicines(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set('search', params.search);
  if (params.category) searchParams.set('category', params.category);
  if (params.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  const url = buildUrl(`/api/medicines${query ? `?${query}` : ''}`);
  const res = await fetch(url);
  return handleResponse(res);
}

export async function fetchMedicine(slug) {
  if (!slug) throw new Error('slug is required');
  const res = await fetch(buildUrl(`/api/medicines/${slug}`));
  return handleResponse(res);
}
