import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  headers: {
    'x-api-key': import.meta.env.VITE_BACKEND_API_KEY || '',
  },
})

// ─── Dashboard / WAHA session (via backend proxy) ─────────────────────────────
export const wahaApi = {
  getSessions: () => http.get('/waha/sessions'),
  createSession: (name) => http.post('/waha/sessions', { name }),
  startSession: (name) => http.post(`/waha/sessions/${name}/start`),
  stopSession: (name) => http.post(`/waha/sessions/${name}/stop`),
  restartSession: (name) => http.post(`/waha/sessions/${name}/restart`),
  resetSession: (name) => http.post(`/waha/sessions/${name}/reset`),
  deleteSession: (name) => http.delete(`/waha/sessions/${name}`),
  getSessionMe: (name) => http.get(`/waha/sessions/${name}/me`),
  getQR: (name) => http.get(`/waha/sessions/${name}/qr`),
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

// ─── Product Groups ──────────────────────────────────────────────────────────
export const productGroupsApi = {
  list: (params) => http.get('/product-groups', { params }),
  create: (data) => http.post('/product-groups', data),
  update: (id, data) => http.put(`/product-groups/${id}`, data),
  remove: (id) => http.delete(`/product-groups/${id}`),
}

// ─── Products ────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params) => http.get('/products', { params }),
  get: (id) => http.get(`/products/${id}`),
  create: (data) => http.post('/products', data),
  update: (id, data) => http.put(`/products/${id}`, data),
  remove: (id) => http.delete(`/products/${id}`),
}

// ─── Configuration ────────────────────────────────────────────────────────────
export const configApi = {
  get: () => http.get('/config'),
  save: (data) => http.put('/config', data),
}
