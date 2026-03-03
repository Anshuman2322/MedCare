import api from './axios.js';

export const getInquiries = (params = {}) => api.get('/api/admin/inquiries', { params });
export const updateInquiryStatus = (id, status) => api.put(`/api/admin/inquiries/${id}/status`, { status });
