import api from './axios.js';

export const getInquiries = () => api.get('/inquiries');
