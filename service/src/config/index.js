require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api',

  // Database config
  database: {
    url: process.env.DATABASE_URL || '',
    name: process.env.DATABASE_NAME || 'whatsapp_admin'
  },

  // JWT config
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // WhatsApp config
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || '',
    apiKey: process.env.WHATSAPP_API_KEY || ''
  },

  // Scheduler config
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED !== 'false',
    interval: parseInt(process.env.SCHEDULER_INTERVAL) || 60000 // 1 minute
  },

  // Reminder config
  reminder: {
    enabled: process.env.REMINDER_ENABLED === 'true' || true,
    interval: parseInt(process.env.REMINDER_INTERVAL) || 60000, // 1 minute
    rateLimit: parseInt(process.env.MESSAGE_RATE_LIMIT) || 1000 // 1 second
  }
};

