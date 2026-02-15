const userRoutes = require('./userRoutes');
const messageRoutes = require('./messageRoutes');
const wahaRoutes = require('./wahaRoutes');
const customerRoutes = require('./customerRoutes');
const promotionSchedulerRoutes = require('./promotionSchedulerRoutes');
const reminderRoutes = require('./reminderRoutes');

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return {
        success: true,
        message: 'WhatsApp Admin API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/api/health',
          users: '/api/users',
          customers: '/api/customers',
          messages: '/api/messages',
          promotions: '/api/promotions',
          reminders: '/api/reminders',
          whatsapp: '/api/whatsapp/sessions',
          webhook: '/api/webhooks/whatsapp'
        }
      };
    }
  },
  {
    method: 'GET',
    path: '/api/health',
    handler: (request, h) => {
      return {
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
    }
  },
  ...userRoutes,
  ...messageRoutes,
  ...customerRoutes,
  ...promotionSchedulerRoutes,
  ...reminderRoutes,
  ...wahaRoutes
];

module.exports = routes;

