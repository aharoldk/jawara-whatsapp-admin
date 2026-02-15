require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const config = require('./config');
const database = require('./config/database');
const routes = require('./routes');
const promotionWorker = require('./workers/promotionWorker');
const reminderWorker = require('./workers/reminderWorker');

const init = async () => {
  // Create Hapi server
  const server = Hapi.server({
    port: config.port,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'], // Allow all origins, configure as needed
        credentials: true
      },
      validate: {
        failAction: async (request, h, err) => {
          throw Boom.badRequest(err.message);
        }
      }
    }
  });

  // Request logging
  server.ext('onRequest', (request, h) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${request.method.toUpperCase()} ${request.path}`);
    return h.continue;
  });

  // Response logging
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;

    // Log response
    const timestamp = new Date().toISOString();
    const statusCode = response.isBoom ? response.output.statusCode : response.statusCode;
    console.log(`[${timestamp}] ${request.method.toUpperCase()} ${request.path} - ${statusCode}`);

    // Handle Boom errors
    if (response.isBoom) {
      const error = response;
      const statusCode = error.output.statusCode;

      return h.response({
        success: false,
        error: {
          message: error.message,
          statusCode: statusCode,
          ...(config.nodeEnv === 'development' && { stack: error.stack })
        }
      }).code(statusCode);
    }

    return h.continue;
  });

  // Register routes
  server.route(routes);

  // 404 handler
  server.route({
    method: '*',
    path: '/{any*}',
    handler: (request, h) => {
      throw Boom.notFound('Route not found');
    }
  });

  try {
    // Connect to database
    await database.connect();

    // Start server
    await server.start();
    console.log('🚀 ================================');
    console.log(`🚀 Server is running on ${server.info.uri}`);
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

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    promotionWorker.stop();
    reminderWorker.stop();
    await server.stop({ timeout: 10000 });
    await database.disconnect();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    promotionWorker.stop();
    reminderWorker.stop();
    await server.stop({ timeout: 10000 });
    await database.disconnect();
    process.exit(0);
  });

  return server;
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

init();

