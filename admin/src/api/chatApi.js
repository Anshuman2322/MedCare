import api from './axios.js';

export const getConversations = (params = {}) => api.get('/api/admin/chat/conversations', { params });
export const getConversation = (id) => api.get(`/api/admin/chat/conversations/${id}`);
export const replyToConversation = (id, text) => api.post(`/api/admin/chat/conversations/${id}/reply`, { text });
export const updateConversationStatus = (id, status) =>
  api.put(`/api/admin/chat/conversations/${id}/status`, { status });

// Badge and alerts: visitors who asked for the team and still need a reply.
export const getChatSummary = () => api.get('/api/admin/chat/summary');

// Live chat: online/away, the wait customers are told, the name they see.
export const getLiveChatSettings = () => api.get('/api/admin/chat/settings');
export const updateLiveChatSettings = (payload) => api.put('/api/admin/chat/settings', payload);

// Saved replies inserted with one click.
export const getQuickReplies = () => api.get('/api/admin/chat/quick-replies');
export const createQuickReply = (payload) => api.post('/api/admin/chat/quick-replies', payload);
export const updateQuickReply = (id, payload) => api.put(`/api/admin/chat/quick-replies/${id}`, payload);
export const deleteQuickReply = (id) => api.delete(`/api/admin/chat/quick-replies/${id}`);

// Fired after a reply or status change so the sidebar badge refreshes at once.
export const CHAT_CHANGED = 'admin-chat-changed';
