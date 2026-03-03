import api from './axios.js';

export const getCategories = () => api.get('/api/categories');
export const getCategoriesWithCount = () => api.get('/api/admin/categories/with-count');
export const createCategory = (data) => api.post('/api/categories', data);
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`);
