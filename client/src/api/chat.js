const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path, { method = 'POST', body, signal } = {}) {
  const res = await fetch(`${API_BASE_URL}/api/chat${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Only the server's own customer-safe message is surfaced; anything else
    // (a proxy error page, a stack trace) is replaced by the caller's copy.
    const error = new Error(typeof data.error === 'string' ? data.error : '');
    error.status = res.status;
    throw error;
  }

  return data;
}

export const startChatSession = (payload) => request('/session', { body: payload });

export const sendChatMessage = (payload) => request('/message', { body: payload });

export const pollChatMessages = ({ sessionToken, after, signal }) => {
  const params = new URLSearchParams({ sessionToken });
  if (after) params.set('after', after);
  return request(`/messages?${params.toString()}`, { method: 'GET', signal });
};

export const requestChatHandoff = (payload) => request('/handoff', { body: payload });

export const recordChatInquiry = (payload) => request('/inquiry-submitted', { body: payload });

export const checkInquiryStatus = (payload) => request('/inquiry-status', { body: payload });
