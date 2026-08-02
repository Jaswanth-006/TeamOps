import axios from "axios";

// Relative base URL: the browser calls "/api/..." on its own origin, and in
// production nginx on the web tier proxies those requests to the app tier. This
// is what lets the same build work behind a load balancer without knowing the
// backend's address. In local dev, Vite's proxy (see vite.config.js) forwards
// "/api" to the backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the auth token (if any) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
