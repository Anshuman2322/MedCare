import api from './axios.js';

// What visitors asked the chat / FAQ search, and how the FAQ handled it.
export const getFaqQuestions = (params = {}) => api.get('/api/admin/faq/questions', { params });
export const updateFaqQuestion = (id, changes) => api.patch(`/api/admin/faq/questions/${id}`, changes);
export const deleteFaqQuestion = (id) => api.delete(`/api/admin/faq/questions/${id}`);
// Number of questions still waiting for an answer (sidebar badge).
export const getFaqSummary = () => api.get('/api/admin/faq/summary');

// The answers visitors see on the FAQ page and in the chat.
export const getFaqEntries = () => api.get('/api/admin/faq/entries');
export const createFaqEntry = (entry) => api.post('/api/admin/faq/entries', entry);
export const updateFaqEntry = (id, entry) => api.put(`/api/admin/faq/entries/${encodeURIComponent(id)}`, entry);
export const deleteFaqEntry = (id) => api.delete(`/api/admin/faq/entries/${encodeURIComponent(id)}`);

// Lets the sidebar badge refresh as soon as the FAQ page changes something.
export const FAQ_CHANGED = 'cureneed:faq-changed';
export const announceFaqChanged = () => window.dispatchEvent(new Event(FAQ_CHANGED));
