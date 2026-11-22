import api from './axios.js';

export const getReviews = (params = {}) => api.get('/api/admin/reviews', { params });
export const updateReview = (id, changes) => api.patch(`/api/admin/reviews/${id}`, changes);
export const deleteReview = (id) => api.delete(`/api/admin/reviews/${id}`);
export const markReviewsSeen = () => api.post('/api/admin/reviews/mark-seen');

// Lets the sidebar badge refresh as soon as the Reviews page changes something.
export const REVIEWS_CHANGED = 'cureneed:reviews-changed';
export const announceReviewsChanged = () => window.dispatchEvent(new Event(REVIEWS_CHANGED));
