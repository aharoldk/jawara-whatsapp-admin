const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const wahaRoutes = require('./wahaRoutes');
const customerRoutes = require('./customerRoutes');
const promotionSchedulerRoutes = require('./promotionSchedulerRoutes');
const reminderRoutes = require('./reminderRoutes');
const broadcastRoutes  = require('./broadcastRoute');
const settingsRoutes   = require('./settingsRoutes');

const routes = [
  {
    method: 'GET',
    path: '/',
    options: { auth: false },
    handler: (request, h) => ({
      success: true,
      message: 'WhatsApp Admin API',
      version: '1.0.0',
      status: 'running'
    })
  },
  {
    method: 'GET',
    path: '/api/health',
    options: { auth: false },
    handler: (request, h) => ({
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  },
  ...authRoutes,
  ...userRoutes,
  ...customerRoutes,
  ...promotionSchedulerRoutes,
  ...reminderRoutes,
  ...wahaRoutes,
  ...broadcastRoutes,
  ...settingsRoutes
];

module.exports = routes;
