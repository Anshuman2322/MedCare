import api from './axios.js';

export const getContactMessages = (params = {}) => api.get('/api/admin/contact-messages', { params });
export const markContactMessageRead = (id) => api.put(`/api/admin/contact-messages/${id}/read`);
