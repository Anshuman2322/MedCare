import api from './axios.js';

export const getCategories = () => api.get('/categories');
export const getCategoriesWithCount = () => api.get('/admin/categories/with-count');
export const createCategory = (data) => api.post('/categories', data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
