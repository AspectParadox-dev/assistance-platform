import axios from 'axios';

// Use VITE_API_URL if provided (e.g. for separate-origin deployments); fall back
// to '/api' which works when the frontend is served from the same origin as the
// backend (Vite dev proxy or production reverse-proxy).
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if we're not already on a public page — avoids redirect loops
      // during the initial /auth/me check and when already on the login page.
      const publicPaths = ['/login', '/apply', '/status'];
      const isPublic = publicPaths.some((p) => window.location.pathname.startsWith(p));
      if (!isPublic) {
        // Carry the reason so LoginPage can show a contextual message:
        // "TokenExpired" → "Your session has expired" vs a generic auth failure.
        const reason = err.response?.data?.error === 'TokenExpired' ? 'expired' : 'unauthorized';
        window.location.href = `/login?reason=${reason}`;
      }
    }
    return Promise.reject(err);
  }
);

export default client;
