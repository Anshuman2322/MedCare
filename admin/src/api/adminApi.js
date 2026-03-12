import api from './axios.js';

export const listAdmins = () => api.get('/api/admin/admins');
export const createAdmin = (payload) => api.post('/api/admin/admins', payload);
export const deleteAdmin = (id) => api.delete(`/api/admin/admins/${id}`);
export const transferOwnership = (targetAdminId) => api.post('/api/admin/admins/transfer-ownership', { targetAdminId });
export const updateAdminRole = (id, role) => api.put(`/api/admin/admins/${id}/role`, { role });
export const updateAdminPermissions = (id, permissions) => api.put(`/api/admin/admins/${id}/permissions`, { permissions });
