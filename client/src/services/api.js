const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function handleResponse(res) {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || res.statusText || 'Request failed');
  }
  return res.json();
}

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function sendInquiry(payload) {
  const res = await fetch(buildUrl('/api/inquiry'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
