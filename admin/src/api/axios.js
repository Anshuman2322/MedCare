import axios from 'axios';

const envBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const baseURL = envBase ? `${envBase}/api` : '/api';

export const api = axios.create({ baseURL });

export default api;
