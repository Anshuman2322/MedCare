import api from './axios.js';

export const requestPasswordReset = (email) => api.post('/api/auth/forgot-password', { email });
export const verifyResetOtp = (email, otp) => api.post('/api/auth/verify-reset-otp', { email, otp });
export const resetPassword = (resetToken, password) => api.post('/api/auth/reset-password', { resetToken, password });
