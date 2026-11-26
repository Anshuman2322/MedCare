import axios from 'axios';

// VITE_ADMIN_API_BASE comes from admin/.env.production ("/" = same site, proxied
// to the API by admin/vercel.json). It wins over VITE_API_URL so a VITE_API_URL
// set in the hosting dashboard can't make the browser call the API cross-site,
// where the SameSite=Lax login cookie is not sent. Local dev and Docker builds
// don't read that file and keep using VITE_API_URL exactly as before.
const configured = import.meta.env.VITE_ADMIN_API_BASE || import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = configured.replace(/\/$/, '');

const api = axios.create({
	baseURL,
	withCredentials: true,
});

export default api;
