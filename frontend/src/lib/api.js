import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  headers: {
    'x-api-key': import.meta.env.VITE_BACKEND_API_KEY || '',
  },
})

// ─── WAHA (direct, browser calls via proxy) ──────────────────────────────────
const waha = axios.create({
  baseURL: import.meta.env.VITE_WAHA_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '/waha'),
  headers: {
    'X-Api-Key': import.meta.env.VITE_WAHA_API_KEY || '',
  },
})

// ─── Dashboard / WAHA session ────────────────────────────────────────────────
export const wahaApi = {
  getSessions: () => waha.get('/api/sessions'),
  startSession: (name) => waha.post(`/api/sessions/${name}/start`),
  stopSession: (name) => waha.post(`/api/sessions/${name}/stop`),
  getSessionMe: (name) => waha.get(`/api/${name}/auth/me`),
  getQR: (name) => waha.get(`/api/${name}/auth/qr`),
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export const ordersApi = {
  list: (params) => http.get('/orders', { params }),
  get: (id) => http.get(`/orders/${id}`),
  create: (data) => http.post('/orders', data),
  update: (id, data) => http.put(`/orders/${id}`, data),
  remove: (id) => http.delete(`/orders/${id}`),
}

// ─── Reminders ───────────────────────────────────────────────────────────────
export const remindersApi = {
  list: (params) => http.get('/reminders', { params }),
  create: (data) => http.post('/reminders', data),
  update: (id, data) => http.put(`/reminders/${id}`, data),
  remove: (id) => http.delete(`/reminders/${id}`),
}

// ─── Broadcast ───────────────────────────────────────────────────────────────
export const broadcastApi = {
  getLists: () => http.get('/broadcast/lists'),
  getList: (id) => http.get(`/broadcast/lists/${id}`),
  createList: (data) => http.post('/broadcast/lists', data),
  updateList: (id, data) => http.put(`/broadcast/lists/${id}`, data),
  deleteList: (id) => http.delete(`/broadcast/lists/${id}`),
  getHistory: (params) => http.get('/broadcast/history', { params }),
  createJob: (data) => http.post('/broadcast/jobs', data),
  updateJob: (id, data) => http.put(`/broadcast/jobs/${id}`, data),
}

// ─── Calendar ────────────────────────────────────────────────────────────────
export const calendarApi = {
  getMonth: (month) => http.get('/calendar', { params: { month } }),
  getDay: (date) => http.get('/calendar/day', { params: { date } }),
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  get: (params) => http.get('/reports', { params }),
}

// ─── Customers (derived from orders) ────────────────────────────────────────
export const customersApi = {
  list: (params) => http.get('/orders', { params: { limit: 100, ...params } }),
}
