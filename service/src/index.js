require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const config = require('./config');
const database = require('./config/database');
const routes = require('./routes');
const { authenticate } = require('./middleware/auth');
const promotionWorker = require('./workers/promotionWorker');
const reminderWorker = require('./workers/reminderWorker');

const init = async () => {
  const server = Hapi.server({
    port: config.port,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        credentials: true,
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'X-Tenant-Subdomain']
      },
      validate: {
        failAction: async (request, h, err) => {
          throw Boom.badRequest(err.message);
        }
      }
    }
  });

  // Register auth middleware plugin
  await server.register(authenticate);

  // Request logging
  server.ext('onRequest', (request, h) => {
    console.log(`[${new Date().toISOString()}] ${request.method.toUpperCase()} ${request.path}`);
    return h.continue;
  });

  // Response logging + error formatting
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;
    const statusCode = response.isBoom ? response.output.statusCode : response.statusCode;
    console.log(`[${new Date().toISOString()}] ${request.method.toUpperCase()} ${request.path} - ${statusCode}`);

    if (response.isBoom) {
      const error = response;
      const code = error.output.statusCode;
      return h.response({
        success: false,
        error: {
          message: error.message,
          statusCode: code,
          ...(config.nodeEnv === 'development' && { stack: error.stack })
        }
      }).code(code);
    }

    return h.continue;
  });

  server.route(routes);

  // 404 handler
  server.route({
    method: '*',
    path: '/{any*}',
    handler: (request, h) => { throw Boom.notFound('Route not found'); }
  });

  try {
    await database.connect();
    await server.start();

    console.log('🚀 ================================');
    console.log(`🚀 Server running on ${server.info.uri}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`📡 API: ${server.info.uri}/api`);
    console.log('🚀 ================================');

    if (config.scheduler?.enabled) {
      promotionWorker.start();
    }
    if (config.reminder?.enabled) {
      reminderWorker.start();
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }

  const graceful = async () => {
    console.log('Shutting down gracefully...');
    promotionWorker.stop();
    reminderWorker.stop();
    await server.stop({ timeout: 10000 });
    await database.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', graceful);
  process.on('SIGINT', graceful);

  return server;
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

init();
