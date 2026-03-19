import client from './client';

// AUTH
export const authAPI = {
  login          : (data) => client.post('/auth/login', data),
  registerTenant : (data) => client.post('/auth/register-tenant', data),
  me             : ()     => client.get('/auth/me')
};

// USERS
export const usersAPI = {
  getAll: (params) => client.get('/users', { params }),
  getById: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id) => client.delete(`/users/${id}`)
};

// CUSTOMERS
export const customersAPI = {
  getAll: (params) => client.get('/customers', { params }),
  getById: (id) => client.get(`/customers/${id}`),
  create: (data) => client.post('/customers', data),
  update: (id, data) => client.put(`/customers/${id}`, data),
  updateData: (id, data) => client.put(`/customers/${id}/data`, data),
  delete: (id) => client.delete(`/customers/${id}`),
  addTag: (id, tag) => client.post(`/customers/${id}/tags`, { tag }),
  removeTag: (id, tag) => client.delete(`/customers/${id}/tags/${tag}`)
};

// PROMOTIONS
export const promotionsAPI = {
  getAll: (params) => client.get('/promotions', { params }),
  getById: (id) => client.get(`/promotions/${id}`),
  create: (data) => client.post('/promotions', data),
  update: (id, data) => client.put(`/promotions/${id}`, data),
  cancel: (id) => client.patch(`/promotions/${id}/cancel`),
  delete: (id) => client.delete(`/promotions/${id}`)
};

// REMINDERS
export const remindersAPI = {
  getAll: (params) => client.get('/reminders', { params }),
  getById: (id) => client.get(`/reminders/${id}`),
  create: (data) => client.post('/reminders', data),
  update: (id, data) => client.put(`/reminders/${id}`, data),
  updateStatus: (id, status) => client.patch(`/reminders/${id}/status`, { status }),
  delete: (id) => client.delete(`/reminders/${id}`),
  testQuery: (id) => client.get(`/reminders/${id}/test`)
};

// SETTINGS
export const settingsAPI = {
  get   : ()     => client.get('/settings'),
  update: (data) => client.put('/settings', data)
};

// BROADCAST
export const broadcastAPI = {
  getCustomers : (params) => client.get('/whatsapp/broadcast/customers', { params }),
  getSessions  : ()       => client.get('/whatsapp/broadcast/sessions'),
  preview      : (data)   => client.post('/whatsapp/broadcast/preview', data),
  send         : (data)   => client.post('/whatsapp/broadcast', data)
};

// WHATSAPP
export const wahaAPI = {
  getSessions: () => client.get('/whatsapp/sessions'),
  startSession: (name) => client.post('/whatsapp/sessions', { name }),
  getQR: (name) => client.get(`/whatsapp/sessions/${name}/qr`),
  getStatus: (name) => client.get(`/whatsapp/sessions/${name}/status`),
  stopSession: (name) => client.post(`/whatsapp/sessions/${name}/stop`),
  sendMessage:   (data) => client.post('/whatsapp/send', data),
  forceRestart:  (name) => client.post(`/whatsapp/sessions/${name}/force-restart`)
};
