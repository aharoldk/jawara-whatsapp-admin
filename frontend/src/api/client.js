import axios from 'axios';
import { getSubdomain } from '../utils/tenant';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use(config => {
  // Auth token
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Tenant subdomain — dikirim di setiap request
  const subdomain = getSubdomain();
  if (subdomain) config.headers['X-Tenant-Subdomain'] = subdomain;

  return config;
});

client.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
